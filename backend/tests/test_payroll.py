from datetime import date, datetime
from decimal import Decimal
import unittest
from unittest import mock
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine, event
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker

from app.api.v1.payroll import (
    approve_payroll_run,
    create_payroll_run,
    get_employee_salary,
    get_my_salary,
    get_payroll_run,
    get_payroll_summary,
    list_employee_salaries,
    list_my_payslips,
    list_organization_payslips,
    list_payroll_runs,
    list_run_payslips,
    mark_payroll_run_paid,
    process_payroll_run,
    set_employee_salary,
    get_cost_analysis,
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
from app.schemas.payroll import (
    EmployeeSalaryCreateOrUpdate,
    PayrollRunCreate,
)
from app.services.payroll import calculate_payslip


class PayrollTestCase(unittest.TestCase):
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
        self.admin_org2 = User(
            id=uuid4(),
            organization_id=self.org2.id,
            role_id=self.roles["ORG_ADMIN"].id,
            email="admin@beta.com",
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
        self.super_admin_org1 = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["SUPER_ADMIN"].id,
            email="superadmin@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.emp_user1 = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["EMPLOYEE"].id,
            email="alice@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.emp_user2 = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["EMPLOYEE"].id,
            email="bob@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.db.add_all([
            self.admin_org1,
            self.hr_org1,
            self.super_admin_org1,
            self.admin_org2,
            self.emp_user1,
            self.emp_user2,
        ])

        # Seed Department & Designation
        self.dept_eng = Department(
            id=uuid4(),
            organization_id=self.org1.id,
            name="Engineering",
            is_active=True,
        )
        self.db.add(self.dept_eng)

        # Seed Employees
        self.emp1 = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            user_id=self.emp_user1.id,
            employee_code="EMP001",
            first_name="Alice",
            last_name="Smith",
            email="alice@acme.com",
            joining_date=date(2026, 1, 1),
            employment_status="ACTIVE",
            department_id=self.dept_eng.id,
        )
        self.emp2 = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            user_id=self.emp_user2.id,
            employee_code="EMP002",
            first_name="Bob",
            last_name="Jones",
            email="bob@acme.com",
            joining_date=date(2026, 1, 1),
            employment_status="ACTIVE",
            department_id=self.dept_eng.id,
        )
        self.emp_inactive = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            user_id=None,
            employee_code="EMP003",
            first_name="Charlie",
            last_name="Brown",
            email="charlie@acme.com",
            joining_date=date(2026, 1, 1),
            employment_status="INACTIVE",
        )
        self.emp_org2 = Employee(
            id=uuid4(),
            organization_id=self.org2.id,
            user_id=None,
            employee_code="EMP999",
            first_name="David",
            last_name="Miller",
            email="david@beta.com",
            joining_date=date(2026, 1, 1),
            employment_status="ACTIVE",
        )
        self.db.add_all([self.emp1, self.emp2, self.emp_inactive, self.emp_org2])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def test_pure_calculation_logic(self):
        gross, net = calculate_payslip(Decimal("50000.00"), Decimal("10000.00"), Decimal("5000.00"))
        self.assertEqual(gross, Decimal("60000.00"))
        self.assertEqual(net, Decimal("55000.00"))

        # Zero deductions
        gross, net = calculate_payslip(Decimal("45000.00"), Decimal("0.00"), Decimal("0.00"))
        self.assertEqual(gross, Decimal("45000.00"))
        self.assertEqual(net, Decimal("45000.00"))

        # Deductions exceed gross pay -> clamp to 0.00
        gross, net = calculate_payslip(Decimal("1000.00"), Decimal("500.00"), Decimal("2000.00"))
        self.assertEqual(gross, Decimal("1500.00"))
        self.assertEqual(net, Decimal("0.00"))

    def test_upsert_employee_salary(self):
        payload = EmployeeSalaryCreateOrUpdate(
            employee_id=self.emp1.id,
            basic_salary=Decimal("60000.00"),
            allowances=Decimal("15000.00"),
            deductions=Decimal("5000.00"),
            payment_method="BANK_TRANSFER",
            bank_name="National Bank",
            bank_account_number="1234567890",
            effective_from=date(2026, 1, 1),
            is_active=True,
        )
        resp = set_employee_salary(payload, db=self.db, current_user=self.admin_org1)
        self.assertEqual(resp.employee_id, self.emp1.id)
        self.assertEqual(resp.basic_salary, Decimal("60000.00"))
        self.assertEqual(resp.gross_salary, Decimal("75000.00"))
        self.assertEqual(resp.net_salary, Decimal("70000.00"))

        # Update existing
        update_payload = EmployeeSalaryCreateOrUpdate(
            employee_id=self.emp1.id,
            basic_salary=Decimal("70000.00"),
            allowances=Decimal("20000.00"),
            deductions=Decimal("6000.00"),
            payment_method="BANK_TRANSFER",
        )
        updated_resp = set_employee_salary(update_payload, db=self.db, current_user=self.admin_org1)
        self.assertEqual(updated_resp.basic_salary, Decimal("70000.00"))
        self.assertEqual(updated_resp.gross_salary, Decimal("90000.00"))
        self.assertEqual(updated_resp.net_salary, Decimal("84000.00"))

    def test_upsert_salary_foreign_org_forbidden(self):
        # Admin from Org 1 cannot set salary for Employee from Org 2
        payload = EmployeeSalaryCreateOrUpdate(
            employee_id=self.emp_org2.id,
            basic_salary=Decimal("50000.00"),
        )
        with self.assertRaises(HTTPException) as cm:
            set_employee_salary(payload, db=self.db, current_user=self.admin_org1)
        self.assertEqual(cm.exception.status_code, 404)

    def test_list_and_filter_salaries(self):
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("5000.00"),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp2.id,
                basic_salary=Decimal("60000.00"),
                allowances=Decimal("8000.00"),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        # List all
        salaries = list_employee_salaries(db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(salaries), 2)

        # Filter by search
        filtered = list_employee_salaries(search="Alice", db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(filtered), 1)
        self.assertEqual(filtered[0].employee_name, "Alice Smith")

        # Filter by department
        dept_filtered = list_employee_salaries(
            department_id=self.dept_eng.id,
            db=self.db,
            current_user=self.admin_org1,
        )
        self.assertEqual(len(dept_filtered), 2)

    def test_payroll_run_lifecycle_and_processing(self):
        # Configure salaries for active employees
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp2.id,
                basic_salary=Decimal("40000.00"),
                allowances=Decimal("5000.00"),
                deductions=Decimal("2000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        # 1. Create run
        run_payload = PayrollRunCreate(
            period_key="2026-10",
            start_date=date(2026, 10, 1),
            end_date=date(2026, 10, 31),
            notes="October 2026 regular payroll",
        )
        run = create_payroll_run(run_payload, db=self.db, current_user=self.admin_org1)
        self.assertEqual(run.status, "DRAFT")
        self.assertEqual(run.period_key, "2026-10")

        # Prevent duplicate run for same period
        with self.assertRaises(HTTPException) as cm:
            create_payroll_run(run_payload, db=self.db, current_user=self.admin_org1)
        self.assertEqual(cm.exception.status_code, 409)

        # 2. Cannot approve DRAFT run
        with self.assertRaises(HTTPException) as cm:
            approve_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(cm.exception.status_code, 400)

        # 3. Process run
        processed = process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(processed.status, "PROCESSED")
        self.assertEqual(processed.total_employees, 2)
        # emp1 gross 60000, ded 5000, net 55000
        # emp2 gross 45000, ded 2000, net 43000
        # total_gross = 105000, total_ded = 7000, total_net = 98000
        self.assertEqual(processed.total_gross_pay, Decimal("105000.00"))
        self.assertEqual(processed.total_deductions, Decimal("7000.00"))
        self.assertEqual(processed.total_net_pay, Decimal("98000.00"))

        # Verify payslips generated
        payslips = list_run_payslips(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(payslips), 2)
        self.assertTrue(all(p.payment_status == "PENDING" for p in payslips))

        # 4. Approve run
        approved = approve_payroll_run(run.id, db=self.db, current_user=self.hr_org1)
        self.assertEqual(approved.status, "APPROVED")
        self.assertIsNotNone(approved.approved_at)

        # 5. Mark paid
        paid = mark_payroll_run_paid(run.id, db=self.db, current_user=self.super_admin_org1)
        self.assertEqual(paid.status, "PAID")
        self.assertIsNotNone(paid.paid_at)

        # Payslips should now be PAID
        updated_payslips = list_run_payslips(run.id, db=self.db, current_user=self.admin_org1)
        self.assertTrue(all(p.payment_status == "PAID" for p in updated_payslips))
        self.assertTrue(all(p.payment_date == date.today() for p in updated_payslips))

        # Cannot re-process a paid run
        with self.assertRaises(HTTPException) as cm:
            process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(cm.exception.status_code, 400)

    def test_employee_self_service(self):
        # Set salary for Alice
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        # Create and process run
        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)

        # Alice checks her own salary
        alice_salary = get_my_salary(db=self.db, current_user=self.emp_user1)
        self.assertEqual(alice_salary.basic_salary, Decimal("50000.00"))
        self.assertEqual(alice_salary.gross_salary, Decimal("60000.00"))
        self.assertEqual(alice_salary.net_salary, Decimal("55000.00"))

        # Alice checks her payslips
        alice_payslips = list_my_payslips(db=self.db, current_user=self.emp_user1)
        self.assertEqual(len(alice_payslips), 1)
        self.assertEqual(alice_payslips[0].period_key, "2026-10")
        self.assertEqual(alice_payslips[0].net_pay, Decimal("55000.00"))

        # Bob has no salary set yet
        with self.assertRaises(HTTPException) as cm:
            get_my_salary(db=self.db, current_user=self.emp_user2)
        self.assertEqual(cm.exception.status_code, 404)

    def test_tenant_isolation(self):
        # Create run in Org 1
        run1 = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        # Org 2 admin lists runs -> should be empty
        org2_runs = list_payroll_runs(db=self.db, current_user=self.admin_org2)
        self.assertEqual(len(org2_runs), 0)

        # Org 2 admin attempts to get Org 1's run -> 404
        with self.assertRaises(HTTPException) as cm:
            get_payroll_run(run1.id, db=self.db, current_user=self.admin_org2)
        self.assertEqual(cm.exception.status_code, 404)

    def test_dashboard_summary_metrics(self):
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)

        summary = get_payroll_summary(db=self.db, current_user=self.admin_org1)
        self.assertEqual(summary.total_gross_payroll, Decimal("60000.00"))
        self.assertEqual(summary.total_net_payroll, Decimal("55000.00"))
        self.assertEqual(summary.total_deductions, Decimal("5000.00"))
        self.assertEqual(summary.pending_approval_runs, 1)
        self.assertEqual(summary.total_runs, 1)
        self.assertEqual(summary.latest_period, "2026-10")

    def test_salary_effective_after_period_excluded(self):
        """Salaries taking effect after period end are excluded from payroll calculation."""
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp2.id,
                basic_salary=Decimal("40000.00"),
                allowances=Decimal("5000.00"),
                deductions=Decimal("2000.00"),
                effective_from=date(2026, 11, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        processed = process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(processed.total_employees, 1)
        self.assertEqual(processed.total_gross_pay, Decimal("60000.00"))
        self.assertEqual(processed.total_deductions, Decimal("5000.00"))
        self.assertEqual(processed.total_net_pay, Decimal("55000.00"))

        payslips = list_run_payslips(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(payslips), 1)
        self.assertEqual(payslips[0].employee_id, self.emp1.id)

    def test_employee_joining_after_period_excluded(self):
        """Employees joining after period end are excluded from payroll calculation."""
        self.emp2.joining_date = date(2026, 11, 1)
        self.db.commit()

        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp2.id,
                basic_salary=Decimal("40000.00"),
                allowances=Decimal("5000.00"),
                deductions=Decimal("2000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        processed = process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(processed.total_employees, 1)
        self.assertEqual(processed.total_gross_pay, Decimal("60000.00"))
        payslips = list_run_payslips(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(payslips), 1)
        self.assertEqual(payslips[0].employee_id, self.emp1.id)

    def test_mid_period_joining_prorated(self):
        """Partial employment period from mid-month join is prorated by calendar days."""
        self.emp1.joining_date = date(2026, 10, 15)
        self.db.commit()

        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        processed_run = process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(processed_run.status, "PROCESSED")
        self.assertEqual(processed_run.total_employees, 1)

        # 17 days out of 31 days:
        # Basic: round(50000 * 17 / 31) = 27419.35
        # Allowances: round(10000 * 17 / 31) = 5483.87
        # Gross: 32903.22
        # Deductions: 5000.00
        # Net: 27903.22
        self.assertEqual(processed_run.total_gross_pay, Decimal("32903.22"))
        self.assertEqual(processed_run.total_deductions, Decimal("5000.00"))
        self.assertEqual(processed_run.total_net_pay, Decimal("27903.22"))

        payslips = list_run_payslips(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(payslips), 1)
        self.assertEqual(payslips[0].basic_salary, Decimal("27419.35"))
        self.assertEqual(payslips[0].allowances, Decimal("5483.87"))
        self.assertEqual(payslips[0].gross_pay, Decimal("32903.22"))
        self.assertEqual(payslips[0].net_pay, Decimal("27903.22"))
        self.assertIn("Prorated: 17/31 calendar days", payslips[0].notes or "")

    def test_mid_period_salary_effective_date_prorated(self):
        """Mid-period salary effective date is prorated by calendar days."""
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 15),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        processed_run = process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(processed_run.status, "PROCESSED")
        self.assertEqual(processed_run.total_gross_pay, Decimal("32903.22"))
        self.assertEqual(processed_run.total_net_pay, Decimal("27903.22"))

    def test_salary_input_validation_and_deductions_boundary(self):
        """Input validation rejects negative numbers and deductions exceeding gross pay."""
        with self.assertRaises(ValidationError):
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("-1000.00"),
                effective_from=date(2026, 1, 1),
            )

        with self.assertRaises(ValidationError):
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("1000.00"),
                allowances=Decimal("-500.00"),
                effective_from=date(2026, 1, 1),
            )

        with self.assertRaises(ValidationError):
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("1000.00"),
                deductions=Decimal("-200.00"),
                effective_from=date(2026, 1, 1),
            )

        with self.assertRaises(HTTPException) as cm:
            set_employee_salary(
                EmployeeSalaryCreateOrUpdate(
                    employee_id=self.emp1.id,
                    basic_salary=Decimal("1000.00"),
                    allowances=Decimal("500.00"),
                    deductions=Decimal("2000.00"),
                    effective_from=date(2026, 1, 1),
                ),
                db=self.db,
                current_user=self.admin_org1,
            )
        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("cannot exceed gross pay", cm.exception.detail)

    def test_recalculation_removes_stale_payslips_and_reconciles_totals(self):
        """Recalculating a run deletes payslips for employees no longer eligible and reconciles totals."""
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp2.id,
                basic_salary=Decimal("40000.00"),
                allowances=Decimal("5000.00"),
                deductions=Decimal("2000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        # First processing: 2 employees
        p1 = process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(p1.total_employees, 2)
        self.assertEqual(p1.total_gross_pay, Decimal("105000.00"))
        self.assertEqual(p1.total_deductions, Decimal("7000.00"))
        self.assertEqual(p1.total_net_pay, Decimal("98000.00"))

        # Now deactivate Emp 2's salary structure
        emp2_sal = self.db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == self.emp2.id).first()
        emp2_sal.is_active = False
        self.db.commit()

        # Recalculate run: Emp 2's payslip must be deleted and totals reconciled
        p2 = process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(p2.total_employees, 1)
        self.assertEqual(p2.total_gross_pay, Decimal("60000.00"))
        self.assertEqual(p2.total_deductions, Decimal("5000.00"))
        self.assertEqual(p2.total_net_pay, Decimal("55000.00"))

        # Verify only 1 payslip remains in database
        slips = list_run_payslips(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(slips), 1)
        self.assertEqual(slips[0].employee_id, self.emp1.id)

    def test_duplicate_processing_is_idempotent(self):
        """Calling process_payroll_run multiple times does not duplicate payslips or inflate totals."""
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        processed2 = process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(processed2.total_employees, 1)
        self.assertEqual(processed2.total_gross_pay, Decimal("60000.00"))
        self.assertEqual(processed2.total_net_pay, Decimal("55000.00"))
        slips = list_run_payslips(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(slips), 1)

    def test_approved_and_paid_runs_cannot_be_recalculated(self):
        """Runs in APPROVED or PAID status are immutable to recalculation."""
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        approve_payroll_run(run.id, db=self.db, current_user=self.hr_org1)

        with self.assertRaises(HTTPException) as cm:
            process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("Cannot re-process payroll run in APPROVED status", cm.exception.detail)

        mark_payroll_run_paid(run.id, db=self.db, current_user=self.super_admin_org1)
        with self.assertRaises(HTTPException) as cm:
            process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("Cannot re-process payroll run in PAID status", cm.exception.detail)

    def test_cross_organization_actions_forbidden(self):
        """Cross-organization run approval and payment attempts fail with 404."""
        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        with self.assertRaises(HTTPException) as cm:
            approve_payroll_run(run.id, db=self.db, current_user=self.admin_org2)
        self.assertEqual(cm.exception.status_code, 404)

        with self.assertRaises(HTTPException) as cm:
            mark_payroll_run_paid(run.id, db=self.db, current_user=self.admin_org2)
        self.assertEqual(cm.exception.status_code, 404)

        with self.assertRaises(HTTPException) as cm:
            list_run_payslips(run.id, db=self.db, current_user=self.admin_org2)
        self.assertEqual(cm.exception.status_code, 404)

    def test_payroll_atomic_rollback_on_failure(self):
        """Failures during processing trigger rollback leaving no orphaned payslips or corrupt state."""
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        self.emp2.joining_date = None
        self.db.commit()
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp2.id,
                basic_salary=Decimal("40000.00"),
                allowances=Decimal("5000.00"),
                deductions=Decimal("2000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        with self.assertRaises(HTTPException):
            process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)

        slips = self.db.query(Payslip).filter(Payslip.payroll_run_id == run.id).all()
        self.assertEqual(len(slips), 0)
        self.db.refresh(run)
        self.assertEqual(run.status, "DRAFT")
        self.assertEqual(run.total_employees, 0)

    def test_rollback_during_payslip_reconciliation_mid_loop(self):
        """
        Deterministic test verifying that if an unexpected exception occurs in the middle
        of payslip reconciliation (after stale payslip deletion and an existing payslip update
        have actually been staged in the SQLAlchemy session), the transaction rolls back completely:
        - Stale payslip deletion is reverted.
        - Existing payslip modification is reverted to its original state.
        - Staged new payslip is discarded.
        - Run totals and status remain completely unchanged.
        """
        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        run.total_employees = 1
        run.total_gross_pay = Decimal("10000.00")
        run.total_deductions = Decimal("1000.00")
        run.total_net_pay = Decimal("9000.00")

        initial_payslip_emp1 = Payslip(
            organization_id=self.org1.id,
            payroll_run_id=run.id,
            employee_id=self.emp1.id,
            period_key=run.period_key,
            basic_salary=Decimal("10000.00"),
            allowances=Decimal("0.00"),
            deductions=Decimal("1000.00"),
            gross_pay=Decimal("10000.00"),
            net_pay=Decimal("9000.00"),
            payment_status="PENDING",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        stale_payslip = Payslip(
            organization_id=self.org1.id,
            payroll_run_id=run.id,
            employee_id=self.emp_inactive.id,
            period_key=run.period_key,
            basic_salary=Decimal("15000.00"),
            allowances=Decimal("0.00"),
            deductions=Decimal("1500.00"),
            gross_pay=Decimal("15000.00"),
            net_pay=Decimal("13500.00"),
            payment_status="PENDING",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.db.add_all([initial_payslip_emp1, stale_payslip])
        self.db.commit()

        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp2.id,
                basic_salary=Decimal("40000.00"),
                allowances=Decimal("5000.00"),
                deductions=Decimal("2000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        from app.services import payroll as payroll_service_module
        original_calculate = payroll_service_module.calculate_payslip

        def injected_calculate(basic, allowances, deductions):
            if basic == Decimal("40000.00"):
                raise RuntimeError("Deterministic crash after staging stale deletion and payslip update")
            return original_calculate(basic, allowances, deductions)

        with mock.patch("app.services.payroll.calculate_payslip", side_effect=injected_calculate):
            with self.assertRaises(RuntimeError) as cm:
                process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
            self.assertIn("Deterministic crash after staging", str(cm.exception))

        db_stale = self.db.query(Payslip).filter(
            Payslip.payroll_run_id == run.id,
            Payslip.employee_id == self.emp_inactive.id,
        ).first()
        self.assertIsNotNone(db_stale, "Stale payslip deletion was NOT rolled back!")
        self.assertEqual(db_stale.basic_salary, Decimal("15000.00"))

        db_emp1_slip = self.db.query(Payslip).filter(
            Payslip.payroll_run_id == run.id,
            Payslip.employee_id == self.emp1.id,
        ).first()
        self.assertIsNotNone(db_emp1_slip)
        self.assertEqual(db_emp1_slip.basic_salary, Decimal("10000.00"), "Emp1 payslip mutation was NOT rolled back!")
        self.assertEqual(db_emp1_slip.gross_pay, Decimal("10000.00"))

        db_emp2_slip = self.db.query(Payslip).filter(
            Payslip.payroll_run_id == run.id,
            Payslip.employee_id == self.emp2.id,
        ).first()
        self.assertIsNone(db_emp2_slip, "Emp2 new payslip should not exist in database!")

        self.db.refresh(run)
        self.assertEqual(run.status, "DRAFT", "Run status was altered despite failure!")
        self.assertEqual(run.total_employees, 1, "Run total_employees was altered despite failure!")
        self.assertEqual(run.total_gross_pay, Decimal("10000.00"))
        self.assertEqual(run.total_net_pay, Decimal("9000.00"))

    def test_rollback_on_database_commit_failure(self):
        """Verify that a database commit failure triggers rollback and leaves no persisted mutations."""
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        with mock.patch.object(self.db, "commit", side_effect=SQLAlchemyError("Simulated DB commit disk I/O failure")):
            with self.assertRaises(SQLAlchemyError) as cm:
                process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
            self.assertIn("Simulated DB commit disk I/O failure", str(cm.exception))

        slips = self.db.query(Payslip).filter(Payslip.payroll_run_id == run.id).all()
        self.assertEqual(len(slips), 0)

        self.db.refresh(run)
        self.assertEqual(run.status, "DRAFT")
        self.assertEqual(run.total_employees, 0)
        self.assertEqual(run.total_gross_pay, Decimal("0.00"))

    def test_missing_joining_date_blocks_payroll(self):
        """Employee with missing joining_date blocks automated payroll processing with HTTP 400."""
        self.emp1.joining_date = None
        self.db.commit()

        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        with self.assertRaises(HTTPException) as cm:
            process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("is missing a joining date", cm.exception.detail)
        self.assertIn("Employment eligibility cannot be established", cm.exception.detail)

    def test_inactive_employee_excluded_from_payroll(self):
        """Employees with non-ACTIVE status (e.g. INACTIVE) are excluded from payroll processing."""
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp_inactive.id,
                basic_salary=Decimal("60000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        processed = process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(processed.total_employees, 1)
        self.assertEqual(processed.total_gross_pay, Decimal("60000.00"))

        payslips = list_run_payslips(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(payslips), 1)
        self.assertEqual(payslips[0].employee_id, self.emp1.id)

    def test_recalculation_removes_payslip_when_employee_becomes_inactive(self):
        """When an employee transitions to INACTIVE after a run was processed, recalculating removes their payslip."""
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp2.id,
                basic_salary=Decimal("40000.00"),
                allowances=Decimal("5000.00"),
                deductions=Decimal("2000.00"),
                effective_from=date(2026, 10, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        p1 = process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(p1.total_employees, 2)
        self.assertEqual(p1.total_gross_pay, Decimal("105000.00"))

        # Transition emp2 to INACTIVE
        self.emp2.employment_status = "INACTIVE"
        self.db.commit()

        # Recalculate
        p2 = process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(p2.total_employees, 1)
        self.assertEqual(p2.total_gross_pay, Decimal("60000.00"))
        self.assertEqual(p2.total_deductions, Decimal("5000.00"))
        self.assertEqual(p2.total_net_pay, Decimal("55000.00"))

        slips = list_run_payslips(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(slips), 1)
        self.assertEqual(slips[0].employee_id, self.emp1.id)

    def test_list_organization_payslips_with_filters(self):
        """List organization payslips supports period_key, department_id, and search filtering."""
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 9, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp2.id,
                basic_salary=Decimal("40000.00"),
                allowances=Decimal("5000.00"),
                deductions=Decimal("2000.00"),
                effective_from=date(2026, 9, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-09",
                start_date=date(2026, 9, 1),
                end_date=date(2026, 9, 30),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        process_payroll_run(run.id, db=self.db, current_user=self.admin_org1)

        # 1. Unfiltered query
        all_slips = list_organization_payslips(db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(all_slips), 2)

        # 2. Filter by matching period_key
        sept_slips = list_organization_payslips(period_key="2026-09", db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(sept_slips), 2)
        other_slips = list_organization_payslips(period_key="2026-08", db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(other_slips), 0)

        # 3. Filter by department
        dept_slips = list_organization_payslips(department_id=self.dept_eng.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(dept_slips), 2)
        random_dept_id = uuid4()
        no_dept_slips = list_organization_payslips(department_id=random_dept_id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(no_dept_slips), 0)

        # 4. Filter by search (name and employee_code)
        alice_slips = list_organization_payslips(search="Alice", db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(alice_slips), 1)
        self.assertEqual(alice_slips[0].employee_id, self.emp1.id)

        code_slips = list_organization_payslips(search="EMP002", db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(code_slips), 1)
        self.assertEqual(code_slips[0].employee_id, self.emp2.id)

    def test_list_organization_payslips_tenant_isolation(self):
        """Org Admin only sees payslips from their own organization."""
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 9, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        run1 = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-09",
                start_date=date(2026, 9, 1),
                end_date=date(2026, 9, 30),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        process_payroll_run(run1.id, db=self.db, current_user=self.admin_org1)

        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp_org2.id,
                basic_salary=Decimal("70000.00"),
                allowances=Decimal("15000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 9, 1),
            ),
            db=self.db,
            current_user=self.admin_org2,
        )
        run2 = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-09",
                start_date=date(2026, 9, 1),
                end_date=date(2026, 9, 30),
            ),
            db=self.db,
            current_user=self.admin_org2,
        )
        process_payroll_run(run2.id, db=self.db, current_user=self.admin_org2)

        slips_org1 = list_organization_payslips(db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(slips_org1), 1)
        self.assertEqual(slips_org1[0].organization_id, self.org1.id)
        self.assertEqual(slips_org1[0].employee_id, self.emp1.id)

        slips_org2 = list_organization_payslips(db=self.db, current_user=self.admin_org2)
        self.assertEqual(len(slips_org2), 1)
        self.assertEqual(slips_org2[0].organization_id, self.org2.id)
        self.assertEqual(slips_org2[0].employee_id, self.emp_org2.id)

    def test_list_organization_payslips_unauthorized_role(self):
        """Employee role is blocked with 403 when accessing organization payslips."""
        guard = require_roles(*PAYROLL_ADMIN_ROLES)
        with self.assertRaises(HTTPException) as ctx:
            guard(current_user=self.emp_user1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 403)

    def test_cost_analysis_aggregation(self):
        """Cost analysis calculates trends, department breakdowns, and excludes draft runs."""
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("10000.00"),
                deductions=Decimal("5000.00"),
                effective_from=date(2026, 8, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        emp_unassigned = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            user_id=None,
            employee_code="EMP004",
            first_name="Unassigned",
            last_name="Worker",
            email="worker@acme.com",
            joining_date=date(2026, 1, 1),
            employment_status="ACTIVE",
            department_id=None,
        )
        self.db.add(emp_unassigned)
        self.db.commit()

        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=emp_unassigned.id,
                basic_salary=Decimal("35000.00"),
                allowances=Decimal("5000.00"),
                deductions=Decimal("2000.00"),
                effective_from=date(2026, 8, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        # Run 1: August (PROCESSED)
        run_aug = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-08",
                start_date=date(2026, 8, 1),
                end_date=date(2026, 8, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        process_payroll_run(run_aug.id, db=self.db, current_user=self.admin_org1)

        # Run 2: September (APPROVED and PAID)
        run_sep = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-09",
                start_date=date(2026, 9, 1),
                end_date=date(2026, 9, 30),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        process_payroll_run(run_sep.id, db=self.db, current_user=self.admin_org1)
        approve_payroll_run(run_sep.id, db=self.db, current_user=self.hr_org1)
        mark_payroll_run_paid(run_sep.id, db=self.db, current_user=self.super_admin_org1)

        # Run 3: October (DRAFT - should be EXCLUDED)
        create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )

        analysis = get_cost_analysis(db=self.db, current_user=self.admin_org1)

        self.assertEqual(analysis.total_gross_cost, Decimal("200000.00"))
        self.assertEqual(analysis.total_deductions, Decimal("14000.00"))
        self.assertEqual(analysis.total_net_payout, Decimal("186000.00"))
        self.assertEqual(analysis.total_employees_paid, 2)
        self.assertEqual(analysis.average_gross_pay_per_employee, Decimal("100000.00"))

        self.assertEqual(len(analysis.period_trends), 2)
        self.assertEqual(analysis.period_trends[0].period_key, "2026-08")
        self.assertEqual(analysis.period_trends[0].total_gross_pay, Decimal("100000.00"))
        self.assertEqual(analysis.period_trends[1].period_key, "2026-09")
        self.assertEqual(analysis.period_trends[1].total_gross_pay, Decimal("100000.00"))

        self.assertEqual(len(analysis.department_breakdown), 2)
        dept_names = [d.department_name for d in analysis.department_breakdown]
        self.assertIn("Engineering", dept_names)
        self.assertIn("Unassigned", dept_names)

        eng_breakdown = next(d for d in analysis.department_breakdown if d.department_name == "Engineering")
        self.assertEqual(eng_breakdown.total_gross_pay, Decimal("120000.00"))
        self.assertEqual(eng_breakdown.percentage_of_total, Decimal("60.00"))
        self.assertEqual(eng_breakdown.employee_count, 1)

        unassigned_breakdown = next(d for d in analysis.department_breakdown if d.department_name == "Unassigned")
        self.assertEqual(unassigned_breakdown.total_gross_pay, Decimal("80000.00"))
        self.assertEqual(unassigned_breakdown.percentage_of_total, Decimal("40.00"))
        self.assertEqual(unassigned_breakdown.employee_count, 1)

    def test_cost_analysis_empty_state(self):
        """When organization has no processed runs, cost analysis returns clean zero state."""
        analysis = get_cost_analysis(db=self.db, current_user=self.admin_org1)
        self.assertEqual(analysis.total_gross_cost, Decimal("0.00"))
        self.assertEqual(analysis.total_net_payout, Decimal("0.00"))
        self.assertEqual(analysis.total_deductions, Decimal("0.00"))
        self.assertEqual(analysis.total_employees_paid, 0)
        self.assertEqual(analysis.average_gross_pay_per_employee, Decimal("0.00"))
        self.assertEqual(analysis.department_breakdown, [])
        self.assertEqual(analysis.period_trends, [])

        create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        analysis_draft_only = get_cost_analysis(db=self.db, current_user=self.admin_org1)
        self.assertEqual(analysis_draft_only.total_gross_cost, Decimal("0.00"))
        self.assertEqual(analysis_draft_only.period_trends, [])

    def test_cost_analysis_unauthorized_role(self):
        """Employee role is blocked with 403 when requesting cost analysis."""
        guard = require_roles(*PAYROLL_ADMIN_ROLES)
        with self.assertRaises(HTTPException) as ctx:
            guard(current_user=self.emp_user1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 403)


