from datetime import date, datetime, time, timedelta, timezone
import unittest
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine, event
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.api.v1.attendance import (
    check_in,
    get_my_attendance,
    get_today_attendance_summary,
    list_attendance,
)
from app.api.v1.employees import (
    create_employee,
    list_employees,
    update_employee,
)
from app.api.v1.shifts import (
    create_shift,
    get_shift,
    list_shifts,
    update_shift,
)
from app.core.permissions import ATTENDANCE_READ_ROLES, require_roles
from app.db.base import Base
from app.models.attendance import Attendance
from app.models.department import Department
from app.models.designation import Designation
from app.models.employee import Employee
from app.models.organization import Organization
from app.models.role import Role
from app.models.shift import Shift
from app.models.user import User
from app.schemas.attendance import (
    CheckInRequest,
    CheckOutRequest,
)
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.schemas.shift import ShiftCreate, ShiftUpdate
from app.services.attendance import (
    get_today_summary,
    record_check_in,
    record_check_out,
)


class AttendanceTestCase(unittest.TestCase):
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
        self.manager_org1 = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["MANAGER"].id,
            email="manager@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.user_emp1 = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["EMPLOYEE"].id,
            email="emp1@acme.com",
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
        self.db.add_all([self.admin_org1, self.manager_org1, self.user_emp1, self.admin_org2])

        # Seed Shifts for Org 1
        self.morning_shift = Shift(
            id=uuid4(),
            organization_id=self.org1.id,
            name="General Morning",
            start_time=time(9, 0),
            end_time=time(18, 0),
            grace_period_minutes=15,
            is_active=True,
        )
        self.inactive_shift = Shift(
            id=uuid4(),
            organization_id=self.org1.id,
            name="Archived Night",
            start_time=time(10, 0),
            end_time=time(19, 0),
            grace_period_minutes=10,
            is_active=False,
        )
        # Shift for Org 2
        self.org2_shift = Shift(
            id=uuid4(),
            organization_id=self.org2.id,
            name="Beta Shift",
            start_time=time(8, 30),
            end_time=time(17, 30),
            grace_period_minutes=15,
            is_active=True,
        )
        self.db.add_all([self.morning_shift, self.inactive_shift, self.org2_shift])

        # Seed Departments and Designations for Org 1
        self.dept_eng = Department(
            id=uuid4(),
            organization_id=self.org1.id,
            name="Engineering",
            is_active=True,
        )
        self.dept_sales = Department(
            id=uuid4(),
            organization_id=self.org1.id,
            name="Sales",
            is_active=True,
        )
        self.db.add_all([self.dept_eng, self.dept_sales])

        self.desig_dev = Designation(
            id=uuid4(),
            organization_id=self.org1.id,
            department_id=self.dept_eng.id,
            name="Developer",
            is_active=True,
        )
        self.desig_sales = Designation(
            id=uuid4(),
            organization_id=self.org1.id,
            department_id=self.dept_sales.id,
            name="Sales Exec",
            is_active=True,
        )
        self.db.add_all([self.desig_dev, self.desig_sales])

        # Seed Employee 1 (linked to user_emp1, Engineering, morning_shift)
        self.emp1 = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            user_id=self.user_emp1.id,
            department_id=self.dept_eng.id,
            designation_id=self.desig_dev.id,
            shift_id=self.morning_shift.id,
            employee_code="EMP-001",
            first_name="Alice",
            last_name="Smith",
            email="emp1@acme.com",
            employment_status="ACTIVE",
        )
        # Seed Manager Employee (linked to manager_org1, Engineering)
        self.emp_mgr = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            user_id=self.manager_org1.id,
            department_id=self.dept_eng.id,
            designation_id=self.desig_dev.id,
            shift_id=self.morning_shift.id,
            employee_code="EMP-MGR",
            first_name="Mary",
            last_name="Manager",
            email="manager@acme.com",
            employment_status="ACTIVE",
        )
        # Seed Employee 2 (no shift, no user link, Engineering)
        self.emp2 = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            user_id=None,
            department_id=self.dept_eng.id,
            designation_id=self.desig_dev.id,
            shift_id=None,
            employee_code="EMP-002",
            first_name="Bob",
            last_name="Jones",
            email="emp2@acme.com",
            employment_status="ACTIVE",
        )
        # Seed Sales Employee (Sales department)
        self.emp_sales = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            user_id=None,
            department_id=self.dept_sales.id,
            designation_id=self.desig_sales.id,
            shift_id=None,
            employee_code="EMP-SALES",
            first_name="Sam",
            last_name="Seller",
            email="sam@acme.com",
            employment_status="ACTIVE",
        )
        # Seed Employee with inactive shift
        self.emp_inactive = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            user_id=None,
            department_id=self.dept_eng.id,
            designation_id=self.desig_dev.id,
            shift_id=self.inactive_shift.id,
            employee_code="EMP-INACT",
            first_name="Ian",
            last_name="Inactive",
            email="ian@acme.com",
            employment_status="ACTIVE",
        )
        self.db.add_all([self.emp1, self.emp_mgr, self.emp2, self.emp_sales, self.emp_inactive])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    # --- Shift Model & CRUD Tests ---

    def test_create_shift_success(self):
        payload = ShiftCreate(
            name="Evening Shift",
            start_time=time(14, 0),
            end_time=time(22, 0),
            grace_period_minutes=20,
            is_active=True,
        )
        created = create_shift(payload=payload, current_user=self.admin_org1, db=self.db)
        self.assertEqual(created.name, "Evening Shift")
        self.assertEqual(created.organization_id, self.org1.id)
        self.assertEqual(created.grace_period_minutes, 20)
        self.assertTrue(created.is_active)

    def test_create_shift_duplicate_name_rejected_within_org(self):
        payload = ShiftCreate(
            name="general morning",  # case-insensitive match with existing
            start_time=time(9, 30),
            end_time=time(18, 30),
        )
        with self.assertRaises(HTTPException) as ctx:
            create_shift(payload=payload, current_user=self.admin_org1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 409)

    def test_create_shift_same_name_allowed_across_different_orgs(self):
        payload = ShiftCreate(
            name="General Morning",
            start_time=time(9, 0),
            end_time=time(18, 0),
        )
        created_org2 = create_shift(payload=payload, current_user=self.admin_org2, db=self.db)
        self.assertEqual(created_org2.name, "General Morning")
        self.assertEqual(created_org2.organization_id, self.org2.id)

    def test_shift_overnight_rejected_by_schema(self):
        with self.assertRaises(ValidationError):
            ShiftCreate(
                name="Night Shift",
                start_time=time(22, 0),
                end_time=time(6, 0),
            )

    def test_shift_equal_times_rejected_by_schema(self):
        with self.assertRaises(ValidationError):
            ShiftCreate(
                name="Zero Shift",
                start_time=time(9, 0),
                end_time=time(9, 0),
            )

    def test_shift_negative_grace_rejected_by_schema(self):
        with self.assertRaises(ValidationError):
            ShiftCreate(
                name="Bad Grace Shift",
                start_time=time(9, 0),
                end_time=time(18, 0),
                grace_period_minutes=-5,
            )

    def test_shift_empty_name_rejected_by_schema(self):
        with self.assertRaises(ValidationError):
            ShiftCreate(
                name="   ",
                start_time=time(9, 0),
                end_time=time(18, 0),
            )

    def test_list_shifts_tenant_isolation(self):
        org1_shifts = list_shifts(current_user=self.admin_org1, db=self.db)
        org1_shift_ids = [s.id for s in org1_shifts]
        self.assertIn(self.morning_shift.id, org1_shift_ids)
        self.assertIn(self.inactive_shift.id, org1_shift_ids)
        self.assertNotIn(self.org2_shift.id, org1_shift_ids)

    def test_get_shift_cross_tenant_404(self):
        with self.assertRaises(HTTPException) as ctx:
            get_shift(shift_id=self.org2_shift.id, current_user=self.admin_org1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_update_shift_times_and_deactivation_guard(self):
        # 1. Update name and grace period
        update_payload = ShiftUpdate(name="Renamed Morning", grace_period_minutes=30)
        updated = update_shift(
            shift_id=self.morning_shift.id,
            payload=update_payload,
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertEqual(updated.name, "Renamed Morning")
        self.assertEqual(updated.grace_period_minutes, 30)

        # 2. Deactivation guard: active employee assigned -> reject deactivation
        deactivate_payload = ShiftUpdate(is_active=False)
        with self.assertRaises(HTTPException) as ctx:
            update_shift(
                shift_id=self.morning_shift.id,
                payload=deactivate_payload,
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("active employees", ctx.exception.detail)

        # 3. Create another shift with no employees and deactivate it -> success
        empty_shift_payload = ShiftCreate(
            name="Temporary Shift",
            start_time=time(10, 0),
            end_time=time(16, 0),
        )
        empty_shift = create_shift(payload=empty_shift_payload, current_user=self.admin_org1, db=self.db)
        deactivated = update_shift(
            shift_id=empty_shift.id,
            payload=ShiftUpdate(is_active=False),
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertFalse(deactivated.is_active)

    # --- Employee Shift Assignment Tests ---

    def test_employee_create_with_shift(self):
        payload = EmployeeCreate(
            employee_code="EMP-003",
            first_name="Charlie",
            last_name="Brown",
            shift_id=self.morning_shift.id,
        )
        created = create_employee(payload=payload, current_user=self.admin_org1, db=self.db)
        self.assertEqual(created.shift_id, self.morning_shift.id)
        self.assertEqual(created.shift_name, self.morning_shift.name)

    def test_employee_create_cross_tenant_shift_rejected(self):
        payload = EmployeeCreate(
            employee_code="EMP-004",
            first_name="Dave",
            shift_id=self.org2_shift.id,  # From Org 2
        )
        with self.assertRaises(HTTPException) as ctx:
            create_employee(payload=payload, current_user=self.admin_org1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("does not exist in this organization", ctx.exception.detail)

    def test_employee_create_inactive_shift_rejected(self):
        payload = EmployeeCreate(
            employee_code="EMP-005",
            first_name="Eve",
            shift_id=self.inactive_shift.id,
        )
        with self.assertRaises(HTTPException) as ctx:
            create_employee(payload=payload, current_user=self.admin_org1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Cannot assign inactive shift", ctx.exception.detail)

    def test_employee_update_shift_assignment(self):
        # Assign morning_shift to emp2
        updated = update_employee(
            employee_id=self.emp2.id,
            payload=EmployeeUpdate(shift_id=self.morning_shift.id),
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertEqual(updated.shift_id, self.morning_shift.id)

        # Clear shift assignment (set to None)
        cleared = update_employee(
            employee_id=self.emp2.id,
            payload=EmployeeUpdate(shift_id=None),
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertIsNone(cleared.shift_id)

    def test_list_employees_filter_by_shift(self):
        filtered = list_employees(shift_id=self.morning_shift.id, current_user=self.admin_org1, db=self.db)
        emp_ids = [e.id for e in filtered]
        self.assertIn(self.emp1.id, emp_ids)
        self.assertNotIn(self.emp2.id, emp_ids)

    # --- Attendance Check-In Tests ---

    def test_check_in_on_time_within_grace_period(self):
        today = date(2026, 10, 14)
        check_in_time = datetime(2026, 10, 14, 9, 10, tzinfo=timezone.utc)

        att = record_check_in(
            db=self.db,
            organization_id=self.org1.id,
            employee_id=self.emp1.id,
            check_in_time=check_in_time,
            notes="Morning arrival",
        )
        self.assertEqual(att.attendance_date, today)
        self.assertEqual(att.status, "PRESENT")
        self.assertEqual(att.late_minutes, 0)
        self.assertIsNone(att.check_out_time)
        self.assertEqual(att.shift_id, self.morning_shift.id)

    def test_check_in_late_after_grace_period(self):
        check_in_time = datetime(2026, 10, 14, 9, 45, tzinfo=timezone.utc)

        att = record_check_in(
            db=self.db,
            organization_id=self.org1.id,
            employee_id=self.emp1.id,
            check_in_time=check_in_time,
        )
        self.assertEqual(att.status, "LATE")
        self.assertEqual(att.late_minutes, 45)

    def test_check_in_without_assigned_shift(self):
        check_in_time = datetime(2026, 10, 14, 11, 0, tzinfo=timezone.utc)
        att = record_check_in(
            db=self.db,
            organization_id=self.org1.id,
            employee_id=self.emp2.id,  # No shift
            check_in_time=check_in_time,
        )
        self.assertEqual(att.status, "PRESENT")
        self.assertEqual(att.late_minutes, 0)
        self.assertIsNone(att.shift_id)

    def test_check_in_duplicate_punch_rejected(self):
        check_in_time1 = datetime(2026, 10, 14, 9, 0, tzinfo=timezone.utc)
        record_check_in(
            db=self.db,
            organization_id=self.org1.id,
            employee_id=self.emp1.id,
            check_in_time=check_in_time1,
        )

        check_in_time2 = datetime(2026, 10, 14, 9, 30, tzinfo=timezone.utc)
        with self.assertRaises(HTTPException) as ctx:
            record_check_in(
                db=self.db,
                organization_id=self.org1.id,
                employee_id=self.emp1.id,
                check_in_time=check_in_time2,
            )
        self.assertEqual(ctx.exception.status_code, 409)
        self.assertIn("already checked in", ctx.exception.detail)

    def test_check_in_inactive_shift_override_rejected(self):
        check_in_time = datetime(2026, 10, 14, 9, 0, tzinfo=timezone.utc)
        with self.assertRaises(HTTPException) as ctx:
            record_check_in(
                db=self.db,
                organization_id=self.org1.id,
                employee_id=self.emp2.id,
                shift_id=self.inactive_shift.id,
                check_in_time=check_in_time,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("inactive shift", ctx.exception.detail)

    def test_check_in_inactive_assigned_shift_rejected(self):
        check_in_time = datetime(2026, 10, 14, 9, 0, tzinfo=timezone.utc)
        with self.assertRaises(HTTPException) as ctx:
            record_check_in(
                db=self.db,
                organization_id=self.org1.id,
                employee_id=self.emp_inactive.id,
                check_in_time=check_in_time,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("assigned shift is inactive", ctx.exception.detail)

    def test_check_in_unauthorized_shift_override_rejected(self):
        # Regular employee emp1 attempting to pass a different shift_id
        payload = CheckInRequest(
            shift_id=self.inactive_shift.id,
            check_in_time=datetime(2026, 10, 14, 9, 0, tzinfo=timezone.utc),
        )
        with self.assertRaises(HTTPException) as ctx:
            check_in(
                payload=payload,
                current_user=self.user_emp1,
                employee=self.emp1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Employees cannot override their assigned shift", ctx.exception.detail)

    # --- Attendance Check-Out Tests ---

    def test_check_out_full_day_working_minutes(self):
        in_time = datetime(2026, 10, 14, 9, 0, tzinfo=timezone.utc)
        out_time = datetime(2026, 10, 14, 18, 0, tzinfo=timezone.utc)

        record_check_in(
            db=self.db,
            organization_id=self.org1.id,
            employee_id=self.emp1.id,
            check_in_time=in_time,
        )

        checked_out = record_check_out(
            db=self.db,
            organization_id=self.org1.id,
            employee_id=self.emp1.id,
            check_out_time=out_time,
            notes="End of day",
        )
        self.assertEqual(checked_out.status, "PRESENT")
        self.assertEqual(checked_out.working_minutes, 540)
        self.assertIsNotNone(checked_out.check_out_time)

    def test_check_out_half_day_working_minutes(self):
        in_time = datetime(2026, 10, 14, 9, 0, tzinfo=timezone.utc)
        out_time = datetime(2026, 10, 14, 12, 0, tzinfo=timezone.utc)

        record_check_in(
            db=self.db,
            organization_id=self.org1.id,
            employee_id=self.emp1.id,
            check_in_time=in_time,
        )

        checked_out = record_check_out(
            db=self.db,
            organization_id=self.org1.id,
            employee_id=self.emp1.id,
            check_out_time=out_time,
        )
        self.assertEqual(checked_out.status, "HALF_DAY")
        self.assertEqual(checked_out.working_minutes, 180)

    def test_check_out_without_check_in_rejected(self):
        out_time = datetime(2026, 10, 14, 18, 0, tzinfo=timezone.utc)
        with self.assertRaises(HTTPException) as ctx:
            record_check_out(
                db=self.db,
                organization_id=self.org1.id,
                employee_id=self.emp1.id,
                check_out_time=out_time,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("No check-in record found", ctx.exception.detail)

    def test_check_out_duplicate_rejected(self):
        in_time = datetime(2026, 10, 14, 9, 0, tzinfo=timezone.utc)
        out_time1 = datetime(2026, 10, 14, 18, 0, tzinfo=timezone.utc)
        out_time2 = datetime(2026, 10, 14, 18, 30, tzinfo=timezone.utc)

        record_check_in(db=self.db, organization_id=self.org1.id, employee_id=self.emp1.id, check_in_time=in_time)
        record_check_out(db=self.db, organization_id=self.org1.id, employee_id=self.emp1.id, check_out_time=out_time1)

        with self.assertRaises(HTTPException) as ctx:
            record_check_out(
                db=self.db,
                organization_id=self.org1.id,
                employee_id=self.emp1.id,
                check_out_time=out_time2,
            )
        self.assertEqual(ctx.exception.status_code, 409)
        self.assertIn("already checked out", ctx.exception.detail)

    def test_check_out_before_check_in_rejected(self):
        in_time = datetime(2026, 10, 14, 9, 0, tzinfo=timezone.utc)
        out_time = datetime(2026, 10, 14, 8, 30, tzinfo=timezone.utc)

        record_check_in(db=self.db, organization_id=self.org1.id, employee_id=self.emp1.id, check_in_time=in_time)
        with self.assertRaises(HTTPException) as ctx:
            record_check_out(
                db=self.db,
                organization_id=self.org1.id,
                employee_id=self.emp1.id,
                check_out_time=out_time,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("earlier than check-in time", ctx.exception.detail)

    # --- Attendance Summary & History Tests ---

    def test_attendance_today_summary_absence_policy(self):
        target_date = date(2026, 10, 14)
        # emp1 punches in on time
        record_check_in(
            db=self.db,
            organization_id=self.org1.id,
            employee_id=self.emp1.id,
            check_in_time=datetime(2026, 10, 14, 9, 5, tzinfo=timezone.utc),
        )

        summary = get_today_summary(
            db=self.db,
            organization_id=self.org1.id,
            target_date=target_date,
        )
        self.assertEqual(summary.date, target_date)
        # 5 active employees in org1 (emp1, emp_mgr, emp2, emp_sales, emp_inactive)
        self.assertEqual(summary.total_employees, 5)
        self.assertEqual(summary.present_count, 1)
        self.assertEqual(summary.late_count, 0)
        self.assertEqual(summary.half_day_count, 0)
        # Employees without a punch are not automatically marked absent
        self.assertEqual(summary.absent_count, 0)
        self.assertEqual(summary.not_checked_in_count, 4)

    def test_list_attendance_filters(self):
        target_date = date(2026, 10, 14)
        record_check_in(
            db=self.db,
            organization_id=self.org1.id,
            employee_id=self.emp1.id,
            check_in_time=datetime(2026, 10, 14, 9, 5, tzinfo=timezone.utc),
        )
        record_check_in(
            db=self.db,
            organization_id=self.org1.id,
            employee_id=self.emp2.id,
            check_in_time=datetime(2026, 10, 14, 10, 30, tzinfo=timezone.utc),
        )

        # Filter by employee_id
        emp1_records = list_attendance(
            employee_id=self.emp1.id,
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertEqual(len(emp1_records), 1)
        self.assertEqual(emp1_records[0].employee_id, self.emp1.id)

        # Filter by shift_id
        shift_records = list_attendance(
            shift_id=self.morning_shift.id,
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertEqual(len(shift_records), 1)
        self.assertEqual(shift_records[0].shift_id, self.morning_shift.id)

        # Filter by date
        date_records = list_attendance(
            attendance_date=target_date,
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertEqual(len(date_records), 2)

    def test_my_attendance_self_service(self):
        record_check_in(
            db=self.db,
            organization_id=self.org1.id,
            employee_id=self.emp1.id,
            check_in_time=datetime(2026, 10, 14, 9, 5, tzinfo=timezone.utc),
        )

        my_records = get_my_attendance(
            current_user=self.user_emp1,
            employee=self.emp1,
            db=self.db,
        )
        self.assertEqual(len(my_records), 1)
        self.assertEqual(my_records[0].employee_id, self.emp1.id)

    # --- Security & Role Restrictions Tests ---

    def test_regular_employee_forbidden_from_listing_attendance(self):
        # A regular employee calling require_roles(*ATTENDANCE_READ_ROLES) is rejected with 403
        role_checker = require_roles(*ATTENDANCE_READ_ROLES)
        with self.assertRaises(HTTPException) as ctx:
            role_checker(current_user=self.user_emp1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 403)

    def test_manager_attendance_scoped_to_department(self):
        # Alice (Engineering) and Sam (Sales) both check in
        record_check_in(
            db=self.db,
            organization_id=self.org1.id,
            employee_id=self.emp1.id,
            check_in_time=datetime(2026, 10, 14, 9, 5, tzinfo=timezone.utc),
        )
        record_check_in(
            db=self.db,
            organization_id=self.org1.id,
            employee_id=self.emp_sales.id,
            check_in_time=datetime(2026, 10, 14, 9, 10, tzinfo=timezone.utc),
        )

        # Manager Mary (Engineering) calls list_attendance
        mgr_records = list_attendance(current_user=self.manager_org1, db=self.db)
        # Should only see Alice (Engineering), not Sam (Sales)
        emp_ids = [r.employee_id for r in mgr_records]
        self.assertIn(self.emp1.id, emp_ids)
        self.assertNotIn(self.emp_sales.id, emp_ids)

    def test_manager_cross_department_access_forbidden(self):
        # Manager Mary (Engineering) attempts to query Sales department
        with self.assertRaises(HTTPException) as ctx:
            list_attendance(
                department_id=self.dept_sales.id,
                current_user=self.manager_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("assigned department", ctx.exception.detail)

    def test_database_status_check_constraint_enforced(self):
        # Direct insert with invalid status must trigger IntegrityError
        invalid_att = Attendance(
            id=uuid4(),
            organization_id=self.org1.id,
            employee_id=self.emp1.id,
            attendance_date=date(2026, 10, 20),
            status="INVALID_STATUS",
        )
        self.db.add(invalid_att)
        with self.assertRaises(IntegrityError):
            self.db.commit()
        self.db.rollback()
