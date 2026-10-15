from datetime import date, datetime
from decimal import Decimal
import unittest
from unittest import mock
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.api.v1.payroll import (
    delete_payroll_run,
    return_payroll_run_to_draft,
    reverse_payroll_run,
    reverse_payroll_run_approval,
    PAYROLL_ADMIN_ROLES,
)
from app.core.permissions import require_roles
from app.db.base import Base
from app.models.department import Department
from app.models.designation import Designation
from app.models.employee import Employee
from app.models.organization import Organization
from app.models.payroll import EmployeeSalary, PayrollRun, Payslip
from app.models.role import Role
from app.models.user import User
from app.schemas.payroll import PayrollRunReversalRequest


class PayrollReversalTestCase(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
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

        # Seed Users
        self.admin_org1 = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["ORG_ADMIN"].id,
            email="admin@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.hr_org1 = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["HR"].id,
            email="hr@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.emp_user = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["EMPLOYEE"].id,
            email="emp@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.admin_org2 = User(
            id=uuid4(),
            organization_id=self.org2.id,
            role_id=self.roles["ORG_ADMIN"].id,
            email="admin@beta.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.db.add_all([self.admin_org1, self.hr_org1, self.emp_user, self.admin_org2])

        # Seed Department & Designation
        self.dept = Department(id=uuid4(), organization_id=self.org1.id, name="Eng", is_active=True)
        self.desig = Designation(id=uuid4(), organization_id=self.org1.id, department_id=self.dept.id, name="Dev", is_active=True)
        self.db.add_all([self.dept, self.desig])

        # Seed Employee & Salary
        self.employee = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            employee_code="EMP-101",
            first_name="Alice",
            last_name="Smith",
            email="alice@acme.com",
            date_of_birth=date(1990, 1, 1),
            joining_date=date(2023, 1, 1),
            employment_status="ACTIVE",
            department_id=self.dept.id,
            designation_id=self.desig.id,
        )
        self.db.add(self.employee)

        self.salary = EmployeeSalary(
            id=uuid4(),
            organization_id=self.org1.id,
            employee_id=self.employee.id,
            basic_salary=Decimal("5000.00"),
            allowances=Decimal("2000.00"),
            deductions=Decimal("500.00"),
            effective_from=date(2023, 1, 1),
            is_active=True,
        )
        self.db.add(self.salary)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def _create_run(self, period_key="2026-08", status="DRAFT", notes=None):
        run = PayrollRun(
            id=uuid4(),
            organization_id=self.org1.id,
            period_key=period_key,
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 31),
            status=status,
            total_employees=0,
            total_gross_pay=Decimal("0.00"),
            total_deductions=Decimal("0.00"),
            total_net_pay=Decimal("0.00"),
            notes=notes,
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def _populate_processed_run(self, run):
        run.status = "PROCESSED"
        run.processed_at = datetime.utcnow()
        run.total_employees = 1
        run.total_gross_pay = Decimal("7000.00")
        run.total_deductions = Decimal("500.00")
        run.total_net_pay = Decimal("6500.00")

        payslip = Payslip(
            id=uuid4(),
            organization_id=self.org1.id,
            payroll_run_id=run.id,
            employee_id=self.employee.id,
            period_key=run.period_key,
            basic_salary=Decimal("5000.00"),
            allowances=Decimal("2000.00"),
            gross_pay=Decimal("7000.00"),
            deductions=Decimal("500.00"),
            net_pay=Decimal("6500.00"),
            payment_status="PENDING",
        )
        self.db.add(payslip)
        self.db.commit()
        self.db.refresh(run)
        return run, payslip

    def test_delete_draft_payroll_run_success(self):
        run = self._create_run("2026-07", "DRAFT")
        delete_payroll_run(run_id=run.id, db=self.db, current_user=self.admin_org1)

        # Confirm run is deleted
        result = self.db.execute(select(PayrollRun).where(PayrollRun.id == run.id)).scalar_one_or_none()
        self.assertIsNone(result)

    def test_delete_non_draft_payroll_run_fails(self):
        run = self._create_run("2026-07", "DRAFT")
        self._populate_processed_run(run)

        # Attempting to delete PROCESSED run must fail
        with self.assertRaises(HTTPException) as ctx:
            delete_payroll_run(run_id=run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Only uncalculated DRAFT runs can be deleted", ctx.exception.detail)

        # Run still exists
        result = self.db.execute(select(PayrollRun).where(PayrollRun.id == run.id)).scalar_one_or_none()
        self.assertIsNotNone(result)

    def test_return_processed_to_draft_success(self):
        run = self._create_run("2026-06", "DRAFT")
        run, payslip = self._populate_processed_run(run)

        payload = PayrollRunReversalRequest(reason="Employee adjustments required before sign-off")
        updated = return_payroll_run_to_draft(
            run_id=run.id,
            payload=payload,
            db=self.db,
            current_user=self.admin_org1,
        )

        self.assertEqual(updated.status, "DRAFT")
        self.assertIsNone(updated.processed_at)
        self.assertEqual(updated.total_employees, 0)
        self.assertEqual(updated.total_gross_pay, Decimal("0.00"))
        self.assertEqual(updated.total_net_pay, Decimal("0.00"))
        self.assertIn("Employee adjustments required", updated.notes or "")
        self.assertIn("RETURNED TO DRAFT", updated.notes or "")

        # Verify payslips were deleted
        payslips = self.db.execute(select(Payslip).where(Payslip.payroll_run_id == run.id)).scalars().all()
        self.assertEqual(len(payslips), 0)

    def test_return_to_draft_short_reason_rejected(self):
        run = self._create_run("2026-06", "DRAFT")
        self._populate_processed_run(run)

        # Pydantic schema validation rejects reasons < 3 characters
        with self.assertRaises(ValidationError):
            PayrollRunReversalRequest(reason="no")

    def test_reverse_approved_to_processed(self):
        run = self._create_run("2026-05", "DRAFT")
        run, payslip = self._populate_processed_run(run)
        run.status = "APPROVED"
        run.approved_at = datetime.utcnow()
        self.db.commit()

        payload = PayrollRunReversalRequest(
            reason="Spotted discrepancy in contractor allowances",
            target_status="PROCESSED",
        )
        updated = reverse_payroll_run_approval(
            run_id=run.id,
            payload=payload,
            db=self.db,
            current_user=self.admin_org1,
        )

        self.assertEqual(updated.status, "PROCESSED")
        self.assertIsNone(updated.approved_at)
        self.assertIn("APPROVAL REVERSED", updated.notes or "")
        self.assertIn("Spotted discrepancy", updated.notes or "")

        # Payslip is still present for review
        payslips = self.db.execute(select(Payslip).where(Payslip.payroll_run_id == run.id)).scalars().all()
        self.assertEqual(len(payslips), 1)

    def test_reverse_approved_to_draft(self):
        run = self._create_run("2026-05", "DRAFT")
        run, payslip = self._populate_processed_run(run)
        run.status = "APPROVED"
        run.approved_at = datetime.utcnow()
        self.db.commit()

        payload = PayrollRunReversalRequest(
            reason="Mass recalculation needed due to tax structure change",
            target_status="DRAFT",
        )
        updated = reverse_payroll_run_approval(
            run_id=run.id,
            payload=payload,
            db=self.db,
            current_user=self.admin_org1,
        )

        self.assertEqual(updated.status, "DRAFT")
        self.assertIsNone(updated.approved_at)
        self.assertIsNone(updated.processed_at)
        self.assertEqual(updated.total_employees, 0)
        self.assertEqual(updated.total_net_pay, Decimal("0.00"))

        # Payslips deleted on return to draft
        payslips = self.db.execute(select(Payslip).where(Payslip.payroll_run_id == run.id)).scalars().all()
        self.assertEqual(len(payslips), 0)

    def test_paid_run_reversal_strictly_prohibited(self):
        run = self._create_run("2026-04", "DRAFT")
        run, payslip = self._populate_processed_run(run)
        run.status = "PAID"
        run.paid_at = datetime.utcnow()
        payslip.payment_status = "PAID"
        self.db.commit()

        payload = PayrollRunReversalRequest(reason="Mistake made, want to undo payment")

        # 1. return_payroll_run_to_draft fails
        with self.assertRaises(HTTPException) as ctx:
            return_payroll_run_to_draft(run_id=run.id, payload=payload, db=self.db, current_user=self.admin_org1)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Cannot return a PAID payroll run to DRAFT", ctx.exception.detail)

        # 2. reverse_payroll_run_approval fails
        with self.assertRaises(HTTPException) as ctx:
            reverse_payroll_run_approval(run_id=run.id, payload=payload, db=self.db, current_user=self.admin_org1)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Cannot reverse approval for a PAID payroll run", ctx.exception.detail)

        # 3. delete_payroll_run fails
        with self.assertRaises(HTTPException) as ctx:
            delete_payroll_run(run_id=run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(ctx.exception.status_code, 400)

        # 4. reverse_payroll_run dispatcher fails
        with self.assertRaises(HTTPException) as ctx:
            reverse_payroll_run(run_id=run.id, payload=payload, db=self.db, current_user=self.admin_org1)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("PAID payroll runs cannot be reversed or reset", ctx.exception.detail)

    def test_reversal_atomic_rollback_on_failure(self):
        run = self._create_run("2026-03", "DRAFT")
        run, payslip = self._populate_processed_run(run)

        payload = PayrollRunReversalRequest(reason="Testing rollback failure")

        # Mock db.commit to raise an exception mid-operation
        with mock.patch.object(self.db, "commit", side_effect=RuntimeError("Simulated database failure")):
            with self.assertRaises(RuntimeError):
                return_payroll_run_to_draft(
                    run_id=run.id,
                    payload=payload,
                    db=self.db,
                    current_user=self.admin_org1,
                )

        # Refresh from database and verify state rolled back completely
        refreshed_run = self.db.execute(select(PayrollRun).where(PayrollRun.id == run.id)).scalar_one()
        self.assertEqual(refreshed_run.status, "PROCESSED")
        self.assertEqual(refreshed_run.total_employees, 1)
        self.assertEqual(refreshed_run.total_net_pay, Decimal("6500.00"))

        payslips = self.db.execute(select(Payslip).where(Payslip.payroll_run_id == run.id)).scalars().all()
        self.assertEqual(len(payslips), 1)

    def test_reversal_cross_tenant_isolation(self):
        run = self._create_run("2026-02", "DRAFT")
        payload = PayrollRunReversalRequest(reason="Org 2 trying to delete Org 1 run")

        # Org 2 admin attempting to delete Org 1 run gets 404
        with self.assertRaises(HTTPException) as ctx:
            delete_payroll_run(run_id=run.id, db=self.db, current_user=self.admin_org2)
        self.assertEqual(ctx.exception.status_code, 404)

        # Org 2 admin attempting to reverse Org 1 run gets 404
        with self.assertRaises(HTTPException) as ctx:
            return_payroll_run_to_draft(run_id=run.id, payload=payload, db=self.db, current_user=self.admin_org2)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_reversal_rbac_employee_denied(self):
        # EMPLOYEE role does not have PAYROLL_ADMIN_ROLES permission
        admin_check = require_roles(*PAYROLL_ADMIN_ROLES)
        with self.assertRaises(HTTPException) as ctx:
            admin_check(current_user=self.emp_user, db=self.db)
        self.assertEqual(ctx.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
