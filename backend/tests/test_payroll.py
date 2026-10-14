from datetime import date, datetime
from decimal import Decimal
import unittest
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import create_engine, event
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
    list_payroll_runs,
    list_run_payslips,
    mark_payroll_run_paid,
    process_payroll_run,
    set_employee_salary,
)
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
        self.db.add_all([self.admin_org1, self.admin_org2, self.emp_user1, self.emp_user2])

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
        approved = approve_payroll_run(run.id, db=self.db, current_user=self.admin_org1)
        self.assertEqual(approved.status, "APPROVED")
        self.assertIsNotNone(approved.approved_at)

        # 5. Mark paid
        paid = mark_payroll_run_paid(run.id, db=self.db, current_user=self.admin_org1)
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
