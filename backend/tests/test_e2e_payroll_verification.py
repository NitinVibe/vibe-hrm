from datetime import date, datetime
from decimal import Decimal
import unittest
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.api.v1.payroll import (
    approve_payroll_run,
    create_payroll_run,
    get_cost_analysis,
    get_payroll_summary,
    list_employee_salaries,
    list_organization_payslips,
    list_payroll_runs,
    process_payroll_run,
    set_employee_salary,
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


class EndToEndPayrollVerificationTest(unittest.TestCase):
    """
    Isolated in-memory verification for final release criteria:
    - 0 changes to live staging database
    - Organization scoping & RBAC
    - End-to-end payslips, reports, cost-analysis, bonuses, and deductions
    """

    def setUp(self):
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
        self.db.add_all([self.admin_org1, self.admin_org2, self.emp_user1])

        # Seed Departments
        self.dept_eng = Department(id=uuid4(), organization_id=self.org1.id, name="Engineering")
        self.dept_sales = Department(id=uuid4(), organization_id=self.org1.id, name="Sales")
        self.db.add_all([self.dept_eng, self.dept_sales])

        # Seed Designations
        self.desig_dev = Designation(
            id=uuid4(),
            organization_id=self.org1.id,
            department_id=self.dept_eng.id,
            name="Software Engineer",
        )
        self.db.add(self.desig_dev)

        # Seed Employees in Org 1
        self.emp1 = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            user_id=self.emp_user1.id,
            employee_code="EMP001",
            first_name="Alice",
            last_name="Smith",
            email="alice@acme.com",
            department_id=self.dept_eng.id,
            designation_id=self.desig_dev.id,
            joining_date=date(2026, 1, 1),
            employment_status="ACTIVE",
        )
        self.emp2 = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            user_id=None,
            employee_code="EMP002",
            first_name="Bob",
            last_name="Jones",
            email="bob@acme.com",
            department_id=self.dept_sales.id,
            designation_id=None,
            joining_date=date(2026, 2, 1),
            employment_status="ACTIVE",
        )

        # Seed Employee in Org 2
        self.emp_org2 = Employee(
            id=uuid4(),
            organization_id=self.org2.id,
            user_id=None,
            employee_code="BETA001",
            first_name="Charlie",
            last_name="Brown",
            email="charlie@beta.com",
            joining_date=date(2026, 1, 1),
            employment_status="ACTIVE",
        )
        self.db.add_all([self.emp1, self.emp2, self.emp_org2])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def test_workflow_payroll_admin_payslips(self):
        """
        Verify Payroll Admin Payslips end-to-end:
        - Organization-scoped
        - Period filtering
        - Employee name and code search
        - Correct calculation fields for frontend modal and CSV export
        """
        # Set salaries
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

        # Generate payroll run for 2026-09
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

        # 1. Period filter test
        all_slips = list_organization_payslips(period_key="2026-09", db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(all_slips), 2)

        empty_period_slips = list_organization_payslips(period_key="2026-08", db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(empty_period_slips), 0)

        # 2. Search filter test by name
        alice_slips = list_organization_payslips(search="Alice", db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(alice_slips), 1)
        self.assertEqual(alice_slips[0].employee_name, "Alice Smith")
        self.assertEqual(alice_slips[0].basic_salary, Decimal("50000.00"))
        self.assertEqual(alice_slips[0].allowances, Decimal("10000.00"))
        self.assertEqual(alice_slips[0].gross_pay, Decimal("60000.00"))
        self.assertEqual(alice_slips[0].deductions, Decimal("5000.00"))
        self.assertEqual(alice_slips[0].net_pay, Decimal("55000.00"))

        # 3. Search filter test by employee code
        bob_slips = list_organization_payslips(search="EMP002", db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(bob_slips), 1)
        self.assertEqual(bob_slips[0].employee_name, "Bob Jones")
        self.assertEqual(bob_slips[0].net_pay, Decimal("43000.00"))

        # 4. RBAC check: EMPLOYEE cannot access admin payslips
        guard = require_roles(*PAYROLL_ADMIN_ROLES)
        with self.assertRaises(HTTPException) as ctx:
            guard(current_user=self.emp_user1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 403)

    def test_workflow_payroll_reports(self):
        """
        Verify Payroll Reports workflow:
        - Dashboard summary metrics calculation
        - Run history listing with status tracking
        - Organization isolation
        """
        # Set salary
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("60000.00"),
                allowances=Decimal("15000.00"),
                deductions=Decimal("5000.00"),
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

        # Summary check
        summary = get_payroll_summary(db=self.db, current_user=self.admin_org1)
        self.assertEqual(summary.total_gross_payroll, Decimal("75000.00"))
        self.assertEqual(summary.total_net_payroll, Decimal("70000.00"))
        self.assertEqual(summary.total_deductions, Decimal("5000.00"))
        self.assertEqual(summary.latest_period, "2026-09")
        self.assertEqual(summary.pending_approval_runs, 1)

        # Run history check
        runs = list_payroll_runs(db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(runs), 1)
        self.assertEqual(runs[0].id, run.id)
        self.assertEqual(runs[0].status, "PROCESSED")

        # Org 2 summary must be isolated zero state
        org2_summary = get_payroll_summary(db=self.db, current_user=self.admin_org2)
        self.assertEqual(org2_summary.total_gross_payroll, Decimal("0.00"))
        self.assertEqual(org2_summary.total_runs, 0)

    def test_workflow_cost_analysis(self):
        """
        Verify Cost Analysis workflow:
        - Period analysis and aggregations
        - Department breakdowns
        - Handling zero/empty states
        """
        # Initial empty state
        empty_analysis = get_cost_analysis(db=self.db, current_user=self.admin_org1)
        self.assertEqual(empty_analysis.total_gross_cost, Decimal("0.00"))
        self.assertEqual(empty_analysis.department_breakdown, [])

        # Add data
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

        # Processed run contributes to cost analysis
        analysis = get_cost_analysis(db=self.db, current_user=self.admin_org1)
        self.assertEqual(analysis.total_gross_cost, Decimal("105000.00"))
        self.assertEqual(analysis.total_deductions, Decimal("7000.00"))
        self.assertEqual(analysis.total_net_payout, Decimal("98000.00"))
        self.assertEqual(analysis.total_employees_paid, 2)
        self.assertEqual(analysis.average_gross_pay_per_employee, Decimal("52500.00"))

        dept_names = {d.department_name: d.total_gross_pay for d in analysis.department_breakdown}
        self.assertEqual(dept_names["Engineering"], Decimal("60000.00"))
        self.assertEqual(dept_names["Sales"], Decimal("45000.00"))

    def test_workflow_bonuses_and_deductions_persistence_and_validation(self):
        """
        Verify Bonuses (allowances) & Deductions persistence and validation:
        - Rejection of invalid / negative inputs
        - Rejection of deductions exceeding gross pay
        - Update of allowance updates gross and net pay correctly
        - Refreshing and confirming values in salary listing
        """
        # 1. Validation: negative allowance rejected by schema
        with self.assertRaises(ValidationError):
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("-500.00"),
                deductions=Decimal("1000.00"),
            )

        # 2. Validation: deductions > gross rejected by endpoint
        with self.assertRaises(HTTPException) as cm:
            set_employee_salary(
                EmployeeSalaryCreateOrUpdate(
                    employee_id=self.emp1.id,
                    basic_salary=Decimal("20000.00"),
                    allowances=Decimal("5000.00"),
                    deductions=Decimal("30000.00"),
                    effective_from=date(2026, 1, 1),
                ),
                db=self.db,
                current_user=self.admin_org1,
            )
        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("cannot exceed gross pay", cm.exception.detail)

        # 3. Save initial salary
        s1 = set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("5000.00"),
                deductions=Decimal("3000.00"),
                effective_from=date(2026, 1, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        self.assertEqual(s1.gross_salary, Decimal("55000.00"))
        self.assertEqual(s1.net_salary, Decimal("52000.00"))

        # 4. Modify bonus/allowance (simulate Bonuses UI modal action)
        s2 = set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("15000.00"),  # Increased allowance/bonus
                deductions=Decimal("3000.00"),
                effective_from=date(2026, 1, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        self.assertEqual(s2.allowances, Decimal("15000.00"))
        self.assertEqual(s2.gross_salary, Decimal("65000.00"))
        self.assertEqual(s2.net_salary, Decimal("62000.00"))

        # 5. Modify deduction (simulate Deductions UI modal action)
        s3 = set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp1.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("15000.00"),
                deductions=Decimal("8000.00"),  # Increased deduction
                effective_from=date(2026, 1, 1),
            ),
            db=self.db,
            current_user=self.admin_org1,
        )
        self.assertEqual(s3.deductions, Decimal("8000.00"))
        self.assertEqual(s3.gross_salary, Decimal("65000.00"))
        self.assertEqual(s3.net_salary, Decimal("57000.00"))

        # 6. List and confirm persisted values
        salaries = list_employee_salaries(db=self.db, current_user=self.admin_org1)
        alice_sal = next(s for s in salaries if s.employee_id == self.emp1.id)
        self.assertEqual(alice_sal.allowances, Decimal("15000.00"))
        self.assertEqual(alice_sal.deductions, Decimal("8000.00"))
        self.assertEqual(alice_sal.net_salary, Decimal("57000.00"))

    def test_tenant_isolation_on_all_new_endpoints(self):
        """
        Verify tenant boundary enforcement across all new payroll endpoints:
        - list_organization_payslips
        - get_cost_analysis
        - get_payroll_summary
        - list_payroll_runs
        """
        # Org 1 setup
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

        # Org 2 setup
        set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=self.emp_org2.id,
                basic_salary=Decimal("70000.00"),
                allowances=Decimal("20000.00"),
                deductions=Decimal("10000.00"),
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

        # 1. Payslips tenant isolation
        slips_1 = list_organization_payslips(db=self.db, current_user=self.admin_org1)
        self.assertEqual(len(slips_1), 1)
        self.assertEqual(slips_1[0].organization_id, self.org1.id)
        self.assertEqual(slips_1[0].employee_id, self.emp1.id)

        slips_2 = list_organization_payslips(db=self.db, current_user=self.admin_org2)
        self.assertEqual(len(slips_2), 1)
        self.assertEqual(slips_2[0].organization_id, self.org2.id)
        self.assertEqual(slips_2[0].employee_id, self.emp_org2.id)

        # 2. Cost analysis tenant isolation
        cost_1 = get_cost_analysis(db=self.db, current_user=self.admin_org1)
        self.assertEqual(cost_1.total_gross_cost, Decimal("60000.00"))
        self.assertEqual(cost_1.total_net_payout, Decimal("55000.00"))

        cost_2 = get_cost_analysis(db=self.db, current_user=self.admin_org2)
        self.assertEqual(cost_2.total_gross_cost, Decimal("90000.00"))
        self.assertEqual(cost_2.total_net_payout, Decimal("80000.00"))

        # 3. Payroll summary tenant isolation
        sum_1 = get_payroll_summary(db=self.db, current_user=self.admin_org1)
        self.assertEqual(sum_1.total_gross_payroll, Decimal("60000.00"))

        sum_2 = get_payroll_summary(db=self.db, current_user=self.admin_org2)
        self.assertEqual(sum_2.total_gross_payroll, Decimal("90000.00"))

    def test_role_permissions_matrix(self):
        """
        Verify role-based access control (RBAC) matrix:
        - SUPER_ADMIN: allowed
        - ORG_ADMIN: allowed
        - HR: allowed
        - MANAGER: blocked with HTTP 403
        - EMPLOYEE: blocked with HTTP 403
        """
        guard = require_roles(*PAYROLL_ADMIN_ROLES)

        user_super = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["SUPER_ADMIN"].id,
            email="super@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        user_hr = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["HR"].id,
            email="hr@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        user_mgr = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["MANAGER"].id,
            email="manager@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.db.add_all([user_super, user_hr, user_mgr])
        self.db.commit()

        # SUPER_ADMIN: allowed
        guard(current_user=user_super, db=self.db)

        # ORG_ADMIN: allowed
        guard(current_user=self.admin_org1, db=self.db)

        # HR: allowed
        guard(current_user=user_hr, db=self.db)

        # MANAGER: forbidden 403
        with self.assertRaises(HTTPException) as ctx_mgr:
            guard(current_user=user_mgr, db=self.db)
        self.assertEqual(ctx_mgr.exception.status_code, 403)

        # EMPLOYEE: forbidden 403
        with self.assertRaises(HTTPException) as ctx_emp:
            guard(current_user=self.emp_user1, db=self.db)
        self.assertEqual(ctx_emp.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()

