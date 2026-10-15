from datetime import date, datetime
from decimal import Decimal
import unittest
from unittest import mock
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine, event, select
from sqlalchemy.orm import sessionmaker

from app.api.v1.payroll import (
    approve_payroll_run,
    create_payroll_run,
    delete_payroll_run,
    get_payroll_run_audit_logs,
    list_payroll_audit_logs,
    mark_payroll_run_paid,
    process_payroll_run,
    return_payroll_run_to_draft,
    reverse_payroll_run_approval,
)
from app.db.base import Base
from app.models.department import Department
from app.models.designation import Designation
from app.models.employee import Employee
from app.models.organization import Organization
from app.models.payroll import EmployeeSalary, PayrollAuditLog, PayrollRun, Payslip
from app.models.role import Role
from app.models.user import User
from app.schemas.payroll import (
    PayrollRunCreate,
    PayrollRunPaymentRequest,
    PayrollRunReversalRequest,
)
from app.services import payroll as payroll_service


class PayrollStateMachineTestCase(unittest.TestCase):
    def setUp(self):
        # Configure in-memory SQLite with foreign keys enabled
        self.engine = create_engine("sqlite:///:memory:")

        @event.listens_for(self.engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.db = self.SessionLocal()

        # Seed Roles
        self.roles = {}
        for role_name in ["SUPER_ADMIN", "ORG_ADMIN", "HR", "MANAGER", "EMPLOYEE"]:
            role = Role(id=uuid4(), name=role_name, description=f"{role_name} role")
            self.db.add(role)
            self.roles[role_name] = role

        # Seed Organizations
        self.org1 = Organization(id=uuid4(), name="Acme Corp", slug="acme", is_active=True)
        self.org2 = Organization(id=uuid4(), name="Beta Inc", slug="beta", is_active=True)
        self.db.add_all([self.org1, self.org2])

        # Seed Users for Org 1 (Maker, Checker, Payer, Employee)
        self.maker_user = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["ORG_ADMIN"].id,
            email="maker@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.checker_user = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["ORG_ADMIN"].id,
            email="checker@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.payer_user = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["ORG_ADMIN"].id,
            email="payer@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.emp_user = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["EMPLOYEE"].id,
            email="employee@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )

        # Seed User for Org 2
        self.other_admin = User(
            id=uuid4(),
            organization_id=self.org2.id,
            role_id=self.roles["ORG_ADMIN"].id,
            email="admin@beta.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.db.add_all([
            self.maker_user,
            self.checker_user,
            self.payer_user,
            self.emp_user,
            self.other_admin,
        ])

        # Seed Department & Designation
        self.dept = Department(
            id=uuid4(),
            organization_id=self.org1.id,
            name="Engineering",
            is_active=True,
        )
        self.desig = Designation(
            id=uuid4(),
            organization_id=self.org1.id,
            department_id=self.dept.id,
            name="Engineer",
            is_active=True,
        )
        self.db.add_all([self.dept, self.desig])

        # Seed Employees
        self.emp1 = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            employee_code="EMP-001",
            first_name="Alice",
            last_name="Smith",
            email="alice@acme.com",
            department_id=self.dept.id,
            designation_id=self.desig.id,
            employment_status="ACTIVE",
            joining_date=date(2026, 1, 1),
        )
        self.emp2 = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            employee_code="EMP-002",
            first_name="Bob",
            last_name="Jones",
            email="bob@acme.com",
            department_id=self.dept.id,
            designation_id=self.desig.id,
            employment_status="ACTIVE",
            joining_date=date(2026, 1, 1),
        )
        self.db.add_all([self.emp1, self.emp2])

        # Seed Active Salaries
        self.sal1 = EmployeeSalary(
            id=uuid4(),
            organization_id=self.org1.id,
            employee_id=self.emp1.id,
            basic_salary=Decimal("10000.00"),
            allowances=Decimal("2000.00"),
            deductions=Decimal("500.00"),
            effective_from=date(2026, 1, 1),
            is_active=True,
        )
        self.sal2 = EmployeeSalary(
            id=uuid4(),
            organization_id=self.org1.id,
            employee_id=self.emp2.id,
            basic_salary=Decimal("15000.00"),
            allowances=Decimal("3000.00"),
            deductions=Decimal("1000.00"),
            effective_from=date(2026, 1, 1),
            is_active=True,
        )
        self.db.add_all([self.sal1, self.sal2])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def _make_mock_request(self, ip="192.168.1.100"):
        req = mock.MagicMock()
        req.client.host = ip
        return req

    def test_01_full_state_machine_happy_path(self):
        """Test full transition: DRAFT -> PROCESSED -> APPROVED -> PAID with audit logging and maker-checker."""
        req = self._make_mock_request("10.0.0.1")

        # 1. Create Draft Run by Maker
        run_create = PayrollRunCreate(
            period_key="2026-11",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
            notes="November 2026 Regular Run",
        )
        run = create_payroll_run(
            payload=run_create,
            request=req,
            db=self.db,
            current_user=self.maker_user,
        )
        self.assertEqual(run.status, "DRAFT")
        self.assertEqual(run.total_employees, 0)
        self.assertEqual(Decimal(str(run.total_net_pay)), Decimal("0.00"))

        # Verify CREATED audit log
        logs = payroll_service.list_payroll_audit_logs(self.db, self.org1.id, run_id=run.id)
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].action, "CREATED")
        self.assertEqual(logs[0].to_status, "DRAFT")
        self.assertEqual(logs[0].actor_user_id, self.maker_user.id)
        self.assertEqual(logs[0].actor_user.email, self.maker_user.email)
        self.assertEqual(logs[0].ip_address, "10.0.0.1")

        # 2. Process Run by Maker
        processed_run = process_payroll_run(
            run_id=run.id,
            request=req,
            db=self.db,
            current_user=self.maker_user,
        )
        self.assertEqual(processed_run.status, "PROCESSED")
        self.assertEqual(processed_run.total_employees, 2)
        # Gross = (10000+2000) + (15000+3000) = 30000; Deductions = 500+1000 = 1500; Net = 28500
        self.assertEqual(Decimal(str(processed_run.total_gross_pay)), Decimal("30000.00"))
        self.assertEqual(Decimal(str(processed_run.total_net_pay)), Decimal("28500.00"))
        self.assertIsNotNone(processed_run.processed_at)

        # Verify PROCESSED audit log
        logs = payroll_service.list_payroll_audit_logs(self.db, self.org1.id, run_id=run.id)
        self.assertEqual(len(logs), 2)
        self.assertEqual(logs[0].action, "PROCESSED")
        self.assertEqual(logs[0].from_status, "DRAFT")
        self.assertEqual(logs[0].to_status, "PROCESSED")
        self.assertEqual(logs[0].actor_user_id, self.maker_user.id)
        self.assertEqual(logs[0].total_employees, 2)

        # 3. Approve Run by Checker (Independent User)
        approved_run = approve_payroll_run(
            run_id=run.id,
            request=req,
            db=self.db,
            current_user=self.checker_user,
        )
        self.assertEqual(approved_run.status, "APPROVED")
        self.assertIsNotNone(approved_run.approved_at)

        # Verify APPROVED audit log
        logs = payroll_service.list_payroll_audit_logs(self.db, self.org1.id, run_id=run.id)
        self.assertEqual(len(logs), 3)
        self.assertEqual(logs[0].action, "APPROVED")
        self.assertEqual(logs[0].from_status, "PROCESSED")
        self.assertEqual(logs[0].to_status, "APPROVED")
        self.assertEqual(logs[0].actor_user_id, self.checker_user.id)

        # 4. Record Payment by Payer (Independent User)
        pay_payload = PayrollRunPaymentRequest(
            payment_reference="NEFT-BATCH-202611-001",
            payment_method="BANK_TRANSFER",
            notes="Processed via corporate net banking batch",
            confirm_internal_recording=True,
        )
        paid_run = mark_payroll_run_paid(
            run_id=run.id,
            payload=pay_payload,
            request=req,
            db=self.db,
            current_user=self.payer_user,
        )
        self.assertEqual(paid_run.status, "PAID")
        self.assertIsNotNone(paid_run.paid_at)

        # Verify all payslips are marked PAID
        payslips = self.db.scalars(
            select(Payslip).where(Payslip.payroll_run_id == run.id)
        ).all()
        self.assertEqual(len(payslips), 2)
        for ps in payslips:
            self.assertEqual(ps.payment_status, "PAID")
            self.assertIsNotNone(ps.payment_date)

        # Verify PAID audit log
        logs = payroll_service.list_payroll_audit_logs(self.db, self.org1.id, run_id=run.id)
        self.assertEqual(len(logs), 4)
        self.assertEqual(logs[0].action, "RECORD_PAYMENT")
        self.assertEqual(logs[0].from_status, "APPROVED")
        self.assertEqual(logs[0].to_status, "PAID")
        self.assertEqual(logs[0].actor_user_id, self.payer_user.id)
        self.assertEqual(logs[0].payment_reference, "NEFT-BATCH-202611-001")

    def test_02_forbidden_direct_transitions(self):
        """Verify invalid direct transitions are rejected with 400 Bad Request."""
        run = PayrollRun(
            id=uuid4(),
            organization_id=self.org1.id,
            period_key="2026-11",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
            status="DRAFT",
            total_employees=0,
            total_gross_pay=Decimal("0.00"),
            total_deductions=Decimal("0.00"),
            total_net_pay=Decimal("0.00"),
        )
        self.db.add(run)
        self.db.commit()

        req = self._make_mock_request()

        # DRAFT -> APPROVED is forbidden
        with self.assertRaises(HTTPException) as ctx:
            approve_payroll_run(run_id=run.id, request=req, db=self.db, current_user=self.checker_user)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("must be in 'PROCESSED' status", ctx.exception.detail)

        # DRAFT -> PAID is forbidden
        with self.assertRaises(HTTPException) as ctx:
            mark_payroll_run_paid(
                run_id=run.id,
                payload=PayrollRunPaymentRequest(payment_reference="REF1", confirm_internal_recording=True),
                request=req,
                db=self.db,
                current_user=self.payer_user,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("must be in 'APPROVED' status", ctx.exception.detail)

        # Transition run to PROCESSED
        run.status = "PROCESSED"
        self.db.commit()

        # PROCESSED -> PAID is forbidden (cannot skip approval)
        with self.assertRaises(HTTPException) as ctx:
            mark_payroll_run_paid(
                run_id=run.id,
                payload=PayrollRunPaymentRequest(payment_reference="REF2", confirm_internal_recording=True),
                request=req,
                db=self.db,
                current_user=self.payer_user,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("must be in 'APPROVED' status", ctx.exception.detail)

    def test_03_reversal_transitions(self):
        """Verify valid reversals PROCESSED -> DRAFT and APPROVED -> PROCESSED."""
        req = self._make_mock_request()

        # Create and process run
        run_create = PayrollRunCreate(
            period_key="2026-11",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
        )
        run = create_payroll_run(payload=run_create, request=req, db=self.db, current_user=self.maker_user)
        process_payroll_run(run_id=run.id, request=req, db=self.db, current_user=self.maker_user)

        # Reversal 1: PROCESSED -> DRAFT
        rev_request = PayrollRunReversalRequest(reason="Adjusting salary numbers")
        draft_run = return_payroll_run_to_draft(
            run_id=run.id,
            request=req,
            payload=rev_request,
            db=self.db,
            current_user=self.checker_user,
        )
        self.assertEqual(draft_run.status, "DRAFT")
        self.assertEqual(draft_run.total_employees, 0)
        self.assertEqual(Decimal(str(draft_run.total_net_pay)), Decimal("0.00"))

        # Payslips must be deleted
        slips = self.db.scalars(select(Payslip).where(Payslip.payroll_run_id == run.id)).all()
        self.assertEqual(len(slips), 0)

        # Audit log check
        logs = payroll_service.list_payroll_audit_logs(self.db, self.org1.id, run_id=run.id)
        self.assertEqual(logs[0].action, "RETURNED_TO_DRAFT")
        self.assertEqual(logs[0].reason, "Adjusting salary numbers")

        # Re-process and approve
        process_payroll_run(run_id=run.id, request=req, db=self.db, current_user=self.maker_user)
        approve_payroll_run(run_id=run.id, request=req, db=self.db, current_user=self.checker_user)

        # Reversal 2: APPROVED -> PROCESSED
        rev_app_request = PayrollRunReversalRequest(reason="Need executive review")
        proc_run = reverse_payroll_run_approval(
            run_id=run.id,
            request=req,
            payload=rev_app_request,
            db=self.db,
            current_user=self.payer_user,
        )
        self.assertEqual(proc_run.status, "PROCESSED")
        # Payslips must remain
        slips = self.db.scalars(select(Payslip).where(Payslip.payroll_run_id == run.id)).all()
        self.assertEqual(len(slips), 2)

        # Audit log check
        logs = payroll_service.list_payroll_audit_logs(self.db, self.org1.id, run_id=run.id)
        self.assertEqual(logs[0].action, "APPROVAL_REVERSED")
        self.assertEqual(logs[0].to_status, "PROCESSED")

    def test_04_paid_run_is_permanently_locked(self):
        """Verify that PAID runs cannot be modified, reversed, deleted, or re-processed."""
        run = PayrollRun(
            id=uuid4(),
            organization_id=self.org1.id,
            period_key="2026-11",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
            status="PAID",
            total_employees=2,
            total_gross_pay=Decimal("30000.00"),
            total_deductions=Decimal("1500.00"),
            total_net_pay=Decimal("28500.00"),
            paid_at=datetime.utcnow(),
        )
        self.db.add(run)
        self.db.commit()

        req = self._make_mock_request()

        # Cannot return to draft
        with self.assertRaises(HTTPException) as ctx:
            return_payroll_run_to_draft(
                run_id=run.id,
                request=req,
                payload=PayrollRunReversalRequest(reason="Try reverse"),
                db=self.db,
                current_user=self.checker_user,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Paid runs are immutable and cannot be reversed", ctx.exception.detail)

        # Cannot reverse approval
        with self.assertRaises(HTTPException) as ctx:
            reverse_payroll_run_approval(
                run_id=run.id,
                request=req,
                payload=PayrollRunReversalRequest(reason="Try reverse app"),
                db=self.db,
                current_user=self.checker_user,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Paid runs are immutable and cannot be reversed", ctx.exception.detail)

        # Cannot delete
        with self.assertRaises(HTTPException) as ctx:
            delete_payroll_run(run_id=run.id, request=req, db=self.db, current_user=self.checker_user)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Paid runs are immutable", ctx.exception.detail)

        # Cannot re-process
        with self.assertRaises(HTTPException) as ctx:
            process_payroll_run(run_id=run.id, request=req, db=self.db, current_user=self.maker_user)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Paid runs are immutable", ctx.exception.detail)

    def test_05_maker_checker_processor_cannot_approve(self):
        """Verify maker-checker: the user who processed the run cannot approve it."""
        req = self._make_mock_request()

        run_create = PayrollRunCreate(
            period_key="2026-11",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
        )
        run = create_payroll_run(payload=run_create, request=req, db=self.db, current_user=self.maker_user)
        process_payroll_run(run_id=run.id, request=req, db=self.db, current_user=self.maker_user)

        # Maker tries to approve -> must fail
        with self.assertRaises(HTTPException) as ctx:
            approve_payroll_run(
                run_id=run.id,
                request=req,
                db=self.db,
                current_user=self.maker_user,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Maker-checker violation", ctx.exception.detail)
        self.assertIn("user who processed this payroll run cannot approve it", ctx.exception.detail)

        # Checker (distinct user) approves -> must succeed
        approved = approve_payroll_run(
            run_id=run.id,
            request=req,
            db=self.db,
            current_user=self.checker_user,
        )
        self.assertEqual(approved.status, "APPROVED")

    def test_06_maker_checker_processor_and_approver_cannot_pay(self):
        """Verify maker-checker: neither the processor nor the approver can record payment."""
        req = self._make_mock_request()

        run_create = PayrollRunCreate(
            period_key="2026-11",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
        )
        run = create_payroll_run(payload=run_create, request=req, db=self.db, current_user=self.maker_user)
        process_payroll_run(run_id=run.id, request=req, db=self.db, current_user=self.maker_user)
        approve_payroll_run(run_id=run.id, request=req, db=self.db, current_user=self.checker_user)

        pay_payload = PayrollRunPaymentRequest(
            payment_reference="BATCH-REF-77",
            confirm_internal_recording=True,
        )

        # Processor (maker) tries to pay -> must fail
        with self.assertRaises(HTTPException) as ctx:
            mark_payroll_run_paid(
                run_id=run.id,
                payload=pay_payload,
                request=req,
                db=self.db,
                current_user=self.maker_user,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Maker-checker violation", ctx.exception.detail)
        self.assertIn("user who processed this payroll run cannot record payment", ctx.exception.detail)

        # Approver (checker) tries to pay -> must fail
        with self.assertRaises(HTTPException) as ctx:
            mark_payroll_run_paid(
                run_id=run.id,
                payload=pay_payload,
                request=req,
                db=self.db,
                current_user=self.checker_user,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Maker-checker violation", ctx.exception.detail)
        self.assertIn("user who approved this payroll run cannot record payment", ctx.exception.detail)

        # Distinct User C (payer) pays -> must succeed
        paid = mark_payroll_run_paid(
            run_id=run.id,
            payload=pay_payload,
            request=req,
            db=self.db,
            current_user=self.payer_user,
        )
        self.assertEqual(paid.status, "PAID")

    def test_07_legacy_run_without_audit_log_allows_admin_action(self):
        """Verify legacy runs without prior audit log records allow authorized admin actions without fabrication."""
        run = PayrollRun(
            id=uuid4(),
            organization_id=self.org1.id,
            period_key="2026-10",
            start_date=date(2026, 10, 1),
            end_date=date(2026, 10, 31),
            status="PROCESSED",
            total_employees=2,
            total_gross_pay=Decimal("30000.00"),
            total_deductions=Decimal("1500.00"),
            total_net_pay=Decimal("28500.00"),
        )
        self.db.add(run)
        self.db.commit()

        # No audit logs exist for this run
        logs = payroll_service.list_payroll_audit_logs(self.db, self.org1.id, run_id=run.id)
        self.assertEqual(len(logs), 0)

        req = self._make_mock_request()

        # Admin can approve without error
        approved = approve_payroll_run(
            run_id=run.id,
            request=req,
            db=self.db,
            current_user=self.maker_user,
        )
        self.assertEqual(approved.status, "APPROVED")

        # Now 1 audit log exists (the APPROVED action)
        logs = payroll_service.list_payroll_audit_logs(self.db, self.org1.id, run_id=run.id)
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].action, "APPROVED")

    def test_08_payment_request_validation(self):
        """Verify payment request validation for reference length and internal recording disclaimer."""
        run = PayrollRun(
            id=uuid4(),
            organization_id=self.org1.id,
            period_key="2026-11",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
            status="APPROVED",
            total_employees=2,
            total_gross_pay=Decimal("30000.00"),
            total_deductions=Decimal("1500.00"),
            total_net_pay=Decimal("28500.00"),
        )
        self.db.add(run)
        self.db.commit()

        req = self._make_mock_request()

        # 1. Reference < 3 characters (Pydantic validation)
        with self.assertRaises(ValidationError):
            PayrollRunPaymentRequest(payment_reference="AB", confirm_internal_recording=True)

        # 2. confirm_internal_recording=False (Service validation)
        pay_payload = PayrollRunPaymentRequest(
            payment_reference="VALID-REF-01",
            confirm_internal_recording=False,
        )
        with self.assertRaises(HTTPException) as ctx:
            mark_payroll_run_paid(
                run_id=run.id,
                payload=pay_payload,
                request=req,
                db=self.db,
                current_user=self.payer_user,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Confirmation that this records internal application status only is required", ctx.exception.detail)

    def test_09_audit_logs_tenant_isolation_and_rbac(self):
        """Verify audit logs are strictly scoped to the organization and cannot be accessed cross-tenant."""
        req = self._make_mock_request()

        run_create = PayrollRunCreate(
            period_key="2026-11",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
        )
        run = create_payroll_run(payload=run_create, request=req, db=self.db, current_user=self.maker_user)

        # Org 1 admin lists run audit logs
        logs = get_payroll_run_audit_logs(run_id=run.id, db=self.db, current_user=self.maker_user)
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].payroll_run_id, run.id)

        # Org 2 admin tries to access Org 1 run audit logs -> 404 Not Found
        with self.assertRaises(HTTPException) as ctx:
            get_payroll_run_audit_logs(run_id=run.id, db=self.db, current_user=self.other_admin)
        self.assertEqual(ctx.exception.status_code, 404)

        # Org 2 admin lists all audit logs -> gets 0 logs (no Org 2 logs exist)
        org2_logs = list_payroll_audit_logs(run_id=None, db=self.db, current_user=self.other_admin)
        self.assertEqual(len(org2_logs), 0)

        # Org 1 admin lists all audit logs -> gets 1 log
        org1_logs = list_payroll_audit_logs(run_id=None, db=self.db, current_user=self.maker_user)
        self.assertEqual(len(org1_logs), 1)

    def test_10_draft_deletion_and_audit(self):
        """Verify deleting a draft run succeeds, removes the cycle, and logs DELETED."""
        req = self._make_mock_request()

        run_create = PayrollRunCreate(
            period_key="2026-11",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
        )
        run = create_payroll_run(payload=run_create, request=req, db=self.db, current_user=self.maker_user)
        run_id = run.id

        # Delete draft run
        delete_payroll_run(run_id=run_id, request=req, db=self.db, current_user=self.maker_user)

        # Verify run no longer exists
        deleted = self.db.get(PayrollRun, run_id)
        self.assertIsNone(deleted)

    def test_11_atomic_rollback_on_audit_failure(self):
        """Verify that if an error occurs during audit log creation, the transaction rolls back cleanly."""
        req = self._make_mock_request()

        run_create = PayrollRunCreate(
            period_key="2026-11",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
        )
        run = create_payroll_run(payload=run_create, request=req, db=self.db, current_user=self.maker_user)
        process_payroll_run(run_id=run.id, request=req, db=self.db, current_user=self.maker_user)

        # Mock create_payroll_audit_log to simulate a database failure during approval
        with mock.patch("app.services.payroll.create_payroll_audit_log", side_effect=RuntimeError("Simulated DB Disk Failure")):
            with self.assertRaises(RuntimeError):
                approve_payroll_run(run_id=run.id, request=req, db=self.db, current_user=self.checker_user)

        # Verify run status is still PROCESSED (rolled back, did not stay APPROVED)
        refreshed_run = self.db.get(PayrollRun, run.id)
        self.assertEqual(refreshed_run.status, "PROCESSED")


if __name__ == "__main__":
    unittest.main()
