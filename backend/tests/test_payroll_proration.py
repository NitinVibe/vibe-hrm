from datetime import date, datetime
from decimal import Decimal
import unittest
from unittest import mock
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.api.v1.payroll import (
    create_payroll_run,
    list_run_payslips,
    process_payroll_run,
    return_payroll_run_to_draft,
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
    PayrollRunReversalRequest,
)
from app.services.payroll import (
    calculate_prorated_payslip,
    quantize_currency,
)


class PayrollProrationTestCase(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.db = self.SessionLocal()

        # Seed roles
        self.roles = {}
        for role_name in ["SUPER_ADMIN", "ORG_ADMIN", "HR", "MANAGER", "EMPLOYEE"]:
            role = Role(id=uuid4(), name=role_name, description=f"{role_name} role")
            self.db.add(role)
            self.roles[role_name] = role

        # Seed organization
        self.org = Organization(id=uuid4(), name="Acme Corp", slug="acme", is_active=True)
        self.db.add(self.org)

        # Seed admin user
        self.admin = User(
            id=uuid4(),
            organization_id=self.org.id,
            role_id=self.roles["ORG_ADMIN"].id,
            email="admin@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.db.add(self.admin)

        # Seed department & designation
        self.dept = Department(id=uuid4(), organization_id=self.org.id, name="Engineering", is_active=True)
        self.desig = Designation(id=uuid4(), organization_id=self.org.id, department_id=self.dept.id, name="Engineer", is_active=True)
        self.db.add_all([self.dept, self.desig])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def _create_employee(self, code: str, joining_date: date | None) -> Employee:
        emp = Employee(
            id=uuid4(),
            organization_id=self.org.id,
            employee_code=code,
            first_name="Test",
            last_name=code,
            email=f"{code.lower()}@acme.com",
            date_of_birth=date(1992, 1, 1),
            joining_date=joining_date,
            employment_status="ACTIVE",
            department_id=self.dept.id,
            designation_id=self.desig.id,
        )
        self.db.add(emp)
        self.db.commit()
        self.db.refresh(emp)
        return emp

    def _set_salary(
        self,
        emp_id,
        basic="50000.00",
        allowances="10000.00",
        deductions="5000.00",
        effective_from=date(2026, 1, 1),
    ) -> EmployeeSalary:
        return set_employee_salary(
            EmployeeSalaryCreateOrUpdate(
                employee_id=emp_id,
                basic_salary=Decimal(basic),
                allowances=Decimal(allowances),
                deductions=Decimal(deductions),
                effective_from=effective_from,
            ),
            db=self.db,
            current_user=self.admin,
        )

    def test_joining_on_first_day_full_period(self):
        """Joining on first day of cycle grants 100% full period without proration."""
        emp = self._create_employee("EMP-F1", joining_date=date(2026, 10, 1))
        self._set_salary(emp.id, basic="60000.00", allowances="15000.00", deductions="5000.00", effective_from=date(2026, 10, 1))

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin,
        )
        processed = process_payroll_run(run.id, db=self.db, current_user=self.admin)
        self.assertEqual(processed.total_employees, 1)
        self.assertEqual(processed.total_gross_pay, Decimal("75000.00"))
        self.assertEqual(processed.total_deductions, Decimal("5000.00"))
        self.assertEqual(processed.total_net_pay, Decimal("70000.00"))

        payslips = list_run_payslips(run.id, db=self.db, current_user=self.admin)
        self.assertEqual(len(payslips), 1)
        self.assertEqual(payslips[0].basic_salary, Decimal("60000.00"))
        self.assertEqual(payslips[0].allowances, Decimal("15000.00"))
        self.assertEqual(payslips[0].gross_pay, Decimal("75000.00"))
        self.assertEqual(payslips[0].deductions, Decimal("5000.00"))
        self.assertEqual(payslips[0].net_pay, Decimal("70000.00"))
        self.assertIsNone(payslips[0].notes)

    def test_mid_period_joining_prorated(self):
        """Joining mid-period (Oct 15) prorates basic and allowances for 17 of 31 calendar days."""
        emp = self._create_employee("EMP-MID", joining_date=date(2026, 10, 15))
        self._set_salary(emp.id, basic="50000.00", allowances="10000.00", deductions="5000.00", effective_from=date(2026, 10, 1))

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin,
        )
        processed = process_payroll_run(run.id, db=self.db, current_user=self.admin)

        # 17 days of 31 days:
        # Basic: round(50000 * 17 / 31) = 27419.35
        # Allowances: round(10000 * 17 / 31) = 5483.87
        # Gross: 32903.22
        # Deductions: 5000.00
        # Net: 27903.22
        self.assertEqual(processed.total_gross_pay, Decimal("32903.22"))
        self.assertEqual(processed.total_deductions, Decimal("5000.00"))
        self.assertEqual(processed.total_net_pay, Decimal("27903.22"))

        payslips = list_run_payslips(run.id, db=self.db, current_user=self.admin)
        self.assertEqual(payslips[0].basic_salary, Decimal("27419.35"))
        self.assertEqual(payslips[0].allowances, Decimal("5483.87"))
        self.assertEqual(payslips[0].gross_pay, Decimal("32903.22"))
        self.assertEqual(payslips[0].deductions, Decimal("5000.00"))
        self.assertEqual(payslips[0].net_pay, Decimal("27903.22"))
        self.assertIn("Prorated: 17/31 calendar days", payslips[0].notes or "")

    def test_salary_effective_mid_period_prorated(self):
        """Salary effective mid-period (Oct 15) prorates compensation for the active 17 days."""
        emp = self._create_employee("EMP-SE", joining_date=date(2026, 1, 1))
        self._set_salary(emp.id, basic="50000.00", allowances="10000.00", deductions="5000.00", effective_from=date(2026, 10, 15))

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin,
        )
        processed = process_payroll_run(run.id, db=self.db, current_user=self.admin)
        self.assertEqual(processed.total_gross_pay, Decimal("32903.22"))
        self.assertEqual(processed.total_net_pay, Decimal("27903.22"))

    def test_joining_after_period_end_excluded(self):
        """Employee joining after period ends has zero eligible days and is excluded."""
        emp = self._create_employee("EMP-LATE", joining_date=date(2026, 11, 1))
        self._set_salary(emp.id, basic="50000.00", allowances="10000.00", deductions="5000.00", effective_from=date(2026, 10, 1))

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin,
        )
        processed = process_payroll_run(run.id, db=self.db, current_user=self.admin)
        self.assertEqual(processed.total_employees, 0)
        self.assertEqual(processed.total_gross_pay, Decimal("0.00"))
        self.assertEqual(processed.total_net_pay, Decimal("0.00"))

        payslips = list_run_payslips(run.id, db=self.db, current_user=self.admin)
        self.assertEqual(len(payslips), 0)

    def test_february_common_year_proration(self):
        """Common year February (28 days): 14 days is exactly 50% proration."""
        emp = self._create_employee("EMP-FEB28", joining_date=date(2026, 2, 15))
        self._set_salary(emp.id, basic="50000.00", allowances="10000.00", deductions="4000.00", effective_from=date(2026, 2, 1))

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-02",
                start_date=date(2026, 2, 1),
                end_date=date(2026, 2, 28),
            ),
            db=self.db,
            current_user=self.admin,
        )
        processed = process_payroll_run(run.id, db=self.db, current_user=self.admin)

        # 14/28 = 0.50
        # Basic: 25000.00, Allowances: 5000.00, Gross: 30000.00, Ded: 4000.00, Net: 26000.00
        self.assertEqual(processed.total_gross_pay, Decimal("30000.00"))
        self.assertEqual(processed.total_deductions, Decimal("4000.00"))
        self.assertEqual(processed.total_net_pay, Decimal("26000.00"))

        payslips = list_run_payslips(run.id, db=self.db, current_user=self.admin)
        self.assertEqual(payslips[0].basic_salary, Decimal("25000.00"))
        self.assertEqual(payslips[0].allowances, Decimal("5000.00"))
        self.assertEqual(payslips[0].gross_pay, Decimal("30000.00"))
        self.assertEqual(payslips[0].net_pay, Decimal("26000.00"))
        self.assertIn("Prorated: 14/28 calendar days", payslips[0].notes or "")

    def test_february_leap_year_proration(self):
        """Leap year February (29 days, 2024): 15 days of 29 days prorated correctly."""
        emp = self._create_employee("EMP-FEB29", joining_date=date(2024, 2, 15))
        self._set_salary(emp.id, basic="58000.00", allowances="5800.00", deductions="2000.00", effective_from=date(2024, 2, 1))

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2024-02",
                start_date=date(2024, 2, 1),
                end_date=date(2024, 2, 29),
            ),
            db=self.db,
            current_user=self.admin,
        )
        processed = process_payroll_run(run.id, db=self.db, current_user=self.admin)

        # 15/29 days:
        # Basic: round(58000 * 15 / 29) = 30000.00
        # Allowances: round(5800 * 15 / 29) = 3000.00
        # Gross: 33000.00, Ded: 2000.00, Net: 31000.00
        self.assertEqual(processed.total_gross_pay, Decimal("33000.00"))
        self.assertEqual(processed.total_net_pay, Decimal("31000.00"))

        payslips = list_run_payslips(run.id, db=self.db, current_user=self.admin)
        self.assertEqual(payslips[0].basic_salary, Decimal("30000.00"))
        self.assertEqual(payslips[0].allowances, Decimal("3000.00"))
        self.assertEqual(payslips[0].gross_pay, Decimal("33000.00"))
        self.assertEqual(payslips[0].net_pay, Decimal("31000.00"))
        self.assertIn("Prorated: 15/29 calendar days", payslips[0].notes or "")

    def test_deduction_capping_prevents_negative_net_pay(self):
        """Fixed deductions exceeding prorated gross pay are capped at gross; net pay cannot be negative."""
        # 2 days of 31 days (Oct 30 to Oct 31)
        emp = self._create_employee("EMP-CAP", joining_date=date(2026, 10, 30))
        # Monthly: Basic 15,500.00 (per day = 500), Allowances 0.00, Monthly Ded 3,000.00
        self._set_salary(emp.id, basic="15500.00", allowances="0.00", deductions="3000.00", effective_from=date(2026, 10, 1))

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin,
        )
        processed = process_payroll_run(run.id, db=self.db, current_user=self.admin)

        # 2 days: Basic = round(15500 * 2 / 31) = 1000.00
        # Gross = 1000.00
        # Fixed deduction 3000.00 > Gross 1000.00 -> Capped to 1000.00
        # Net = 0.00 (NEVER negative!)
        self.assertEqual(processed.total_gross_pay, Decimal("1000.00"))
        self.assertEqual(processed.total_deductions, Decimal("1000.00"))
        self.assertEqual(processed.total_net_pay, Decimal("0.00"))

        payslips = list_run_payslips(run.id, db=self.db, current_user=self.admin)
        self.assertEqual(payslips[0].gross_pay, Decimal("1000.00"))
        self.assertEqual(payslips[0].deductions, Decimal("1000.00"))
        self.assertEqual(payslips[0].net_pay, Decimal("0.00"))
        self.assertIn("Fixed deductions capped at gross", payslips[0].notes or "")

    def test_rounding_precision_and_reconciliation(self):
        """Repeating decimals round cleanly and reconcile across basic, allowances, deductions, and run totals."""
        emp = self._create_employee("EMP-ROUND", joining_date=date(2026, 10, 15))
        # 17 days of 31 days with repeating decimal components:
        # Basic: 33333.33 * 17 / 31 = 18279.567903... -> 18279.57
        # Allowances: 7777.77 * 17 / 31 = 4265.23129... -> 4265.23
        # Gross: 18279.57 + 4265.23 = 22544.80
        # Deductions: 1234.56
        # Net: 22544.80 - 1234.56 = 21310.24
        self._set_salary(emp.id, basic="33333.33", allowances="7777.77", deductions="1234.56", effective_from=date(2026, 10, 1))

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin,
        )
        processed = process_payroll_run(run.id, db=self.db, current_user=self.admin)

        self.assertEqual(processed.total_gross_pay, Decimal("22544.80"))
        self.assertEqual(processed.total_deductions, Decimal("1234.56"))
        self.assertEqual(processed.total_net_pay, Decimal("21310.24"))
        self.assertEqual(processed.total_gross_pay - processed.total_deductions, processed.total_net_pay)

    def test_ambiguous_multiple_active_salaries_rejected(self):
        """Multiple overlapping active salary structures during a cycle are rejected with HTTP 400."""
        emp = self._create_employee("EMP-AMBIG", joining_date=date(2026, 1, 1))
        sal1 = self._set_salary(emp.id, basic="40000.00", allowances="5000.00", deductions="2000.00", effective_from=date(2026, 10, 1))
        sal2 = EmployeeSalary(
            id=uuid4(),
            organization_id=self.org.id,
            employee_id=emp.id,
            basic_salary=Decimal("50000.00"),
            allowances=Decimal("8000.00"),
            deductions=Decimal("3000.00"),
            effective_from=date(2026, 10, 15),
            is_active=True,
        )

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin,
        )

        orig_execute = self.db.execute

        def mock_execute(statement, *args, **kwargs):
            res = orig_execute(statement, *args, **kwargs)
            stmt_str = str(statement)
            if "employee_salaries" in stmt_str and "WHERE" in stmt_str:
                mock_scalars = mock.MagicMock()
                mock_scalars.all.return_value = [sal1, sal2]
                res_mock = mock.MagicMock()
                res_mock.scalars.return_value = mock_scalars
                return res_mock
            return res

        with mock.patch.object(self.db, "execute", side_effect=mock_execute):
            with self.assertRaises(HTTPException) as cm:
                process_payroll_run(run.id, db=self.db, current_user=self.admin)
            self.assertEqual(cm.exception.status_code, 400)
            self.assertIn("active salary structures during period", cm.exception.detail)
            self.assertIn("Multiple overlapping active salary records during a cycle is ambiguous", cm.exception.detail)

    def test_missing_joining_date_blocks_payroll(self):
        """Missing employee joining date blocks automated processing with HTTP 400."""
        emp = self._create_employee("EMP-NOJOIN", joining_date=None)
        self._set_salary(emp.id, basic="50000.00", allowances="10000.00", deductions="5000.00", effective_from=date(2026, 10, 1))

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin,
        )
        with self.assertRaises(HTTPException) as cm:
            process_payroll_run(run.id, db=self.db, current_user=self.admin)
        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("missing a joining date", cm.exception.detail)

    def test_rollback_on_calculation_failure_leaves_no_payslips(self):
        """Transaction rolls back completely if failure occurs; no partial payslips persisted."""
        emp = self._create_employee("EMP-FAIL", joining_date=date(2026, 10, 15))
        self._set_salary(emp.id, basic="50000.00", allowances="10000.00", deductions="5000.00", effective_from=date(2026, 10, 1))

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin,
        )

        with mock.patch.object(self.db, "commit", side_effect=RuntimeError("Database commit failure")):
            with self.assertRaises(RuntimeError):
                process_payroll_run(run.id, db=self.db, current_user=self.admin)

        # Confirm rollback
        slips = self.db.execute(select(Payslip).where(Payslip.payroll_run_id == run.id)).scalars().all()
        self.assertEqual(len(slips), 0)
        refreshed_run = self.db.execute(select(PayrollRun).where(PayrollRun.id == run.id)).scalar_one()
        self.assertEqual(refreshed_run.status, "DRAFT")
        self.assertEqual(refreshed_run.total_employees, 0)

    def test_piyush_september_2026_proration_fixture(self):
        """
        Verify Piyush's September 2026 calculation in isolated fixture:
        - Cycle: 2026-09-01 to 2026-09-30 (30 days)
        - Joined: 2026-09-10 (21 eligible days = 21/30)
        - Salary: Basic 15000.00, Allowances 0.00, Deductions 550.00, Effective 2026-09-10
        - Prorated Basic: 15000.00 * 21 / 30 = 10500.00
        - Gross Pay: 10500.00, Deductions: 550.00, Net Pay: 9950.00
        - Reversal resets to DRAFT and clears payslips atomically.
        """
        piyush = self._create_employee("EMP-PIYUSH", joining_date=date(2026, 9, 10))
        self._set_salary(
            piyush.id,
            basic="15000.00",
            allowances="0.00",
            deductions="550.00",
            effective_from=date(2026, 9, 10),
        )

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-09",
                start_date=date(2026, 9, 1),
                end_date=date(2026, 9, 30),
            ),
            db=self.db,
            current_user=self.admin,
        )
        processed = process_payroll_run(run.id, db=self.db, current_user=self.admin)

        self.assertEqual(processed.total_employees, 1)
        self.assertEqual(processed.total_gross_pay, Decimal("10500.00"))
        self.assertEqual(processed.total_deductions, Decimal("550.00"))
        self.assertEqual(processed.total_net_pay, Decimal("9950.00"))

        payslips = list_run_payslips(run.id, db=self.db, current_user=self.admin)
        self.assertEqual(len(payslips), 1)
        self.assertEqual(payslips[0].basic_salary, Decimal("10500.00"))
        self.assertEqual(payslips[0].gross_pay, Decimal("10500.00"))
        self.assertEqual(payslips[0].deductions, Decimal("550.00"))
        self.assertEqual(payslips[0].net_pay, Decimal("9950.00"))
        self.assertIn("Prorated: 21/30 calendar days", payslips[0].notes or "")

        # Test atomic reversal
        reversed_run = return_payroll_run_to_draft(
            run_id=run.id,
            payload=PayrollRunReversalRequest(reason="Test reversal for audit"),
            db=self.db,
            current_user=self.admin,
        )
        self.assertEqual(reversed_run.status, "DRAFT")
        self.assertEqual(reversed_run.total_employees, 0)
        self.assertEqual(reversed_run.total_gross_pay, Decimal("0.00"))
        self.assertEqual(reversed_run.total_net_pay, Decimal("0.00"))
        remaining_slips = list_run_payslips(run.id, db=self.db, current_user=self.admin)
        self.assertEqual(len(remaining_slips), 0)

    def test_mahesh_october_2026_proration_fixture(self):
        """
        Verify Mahesh's October 2026 calculation in isolated fixture:
        - Cycle: 2026-10-01 to 2026-10-31 (31 days)
        - Joined: 2026-01-01, Salary Effective: 2026-10-15 (17 eligible days = 17/31)
        - Salary: Basic 10000.00, Allowances 0.00, Deductions 100.00
        - Prorated Basic: round(10000.00 * 17 / 31) = 5483.87
        - Gross Pay: 5483.87, Deductions: 100.00, Net Pay: 5383.87
        - Reversal resets to DRAFT and clears payslips atomically.
        """
        mahesh = self._create_employee("EMP-MAHESH", joining_date=date(2026, 1, 1))
        self._set_salary(
            mahesh.id,
            basic="10000.00",
            allowances="0.00",
            deductions="100.00",
            effective_from=date(2026, 10, 15),
        )

        run = create_payroll_run(
            PayrollRunCreate(
                period_key="2026-10",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 31),
            ),
            db=self.db,
            current_user=self.admin,
        )
        processed = process_payroll_run(run.id, db=self.db, current_user=self.admin)

        self.assertEqual(processed.total_employees, 1)
        self.assertEqual(processed.total_gross_pay, Decimal("5483.87"))
        self.assertEqual(processed.total_deductions, Decimal("100.00"))
        self.assertEqual(processed.total_net_pay, Decimal("5383.87"))

        payslips = list_run_payslips(run.id, db=self.db, current_user=self.admin)
        self.assertEqual(len(payslips), 1)
        self.assertEqual(payslips[0].basic_salary, Decimal("5483.87"))
        self.assertEqual(payslips[0].gross_pay, Decimal("5483.87"))
        self.assertEqual(payslips[0].deductions, Decimal("100.00"))
        self.assertEqual(payslips[0].net_pay, Decimal("5383.87"))
        self.assertIn("Prorated: 17/31 calendar days", payslips[0].notes or "")

        # Test atomic reversal
        reversed_run = return_payroll_run_to_draft(
            run_id=run.id,
            payload=PayrollRunReversalRequest(reason="Test reversal for audit"),
            db=self.db,
            current_user=self.admin,
        )
        self.assertEqual(reversed_run.status, "DRAFT")
        self.assertEqual(reversed_run.total_employees, 0)
        remaining_slips = list_run_payslips(run.id, db=self.db, current_user=self.admin)
        self.assertEqual(len(remaining_slips), 0)


if __name__ == "__main__":
    unittest.main()
