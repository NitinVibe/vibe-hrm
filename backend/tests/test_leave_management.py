from datetime import date, datetime, timedelta
from decimal import Decimal
import unittest
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import create_engine, event, select
from sqlalchemy.orm import sessionmaker

from app.api.v1.leave_balances import allocate_leave_balance, get_current_user_leave_balances, list_leave_balances
from app.api.v1.leave_policies import create_or_update_leave_policy, list_leave_policies
from app.api.v1.leave_requests import (
    action_leave_request,
    apply_leave,
    cancel_leave_request,
    list_leave_requests,
    list_my_leave_requests,
)
from app.api.v1.leave_types import (
    create_leave_type,
    get_leave_type,
    list_leave_types,
    update_leave_type,
)
from app.db.base import Base
from app.models.department import Department
from app.models.designation import Designation
from app.models.employee import Employee
from app.models.leave_balance import LeaveBalance
from app.models.leave_policy import LeavePolicy
from app.models.leave_request import LeaveRequest
from app.models.leave_type import LeaveType
from app.models.organization import Organization
from app.models.role import Role
from app.models.user import User
from app.schemas.leave_balance import LeaveBalanceCreate
from app.schemas.leave_policy import LeavePolicyCreate
from app.schemas.leave_request import LeaveRequestAction, LeaveRequestCreate
from app.schemas.leave_type import LeaveTypeCreate, LeaveTypeUpdate
from app.services import leave_service


class LeaveManagementTestCase(unittest.TestCase):
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
        for r_name in ["SUPER_ADMIN", "ORG_ADMIN", "HR", "MANAGER", "EMPLOYEE"]:
            role = Role(id=uuid4(), name=r_name, description=f"{r_name} role")
            self.db.add(role)
            self.roles[r_name] = role

        # Seed Organizations
        self.org1 = Organization(id=uuid4(), name="Org One", slug="org-one", is_active=True)
        self.org2 = Organization(id=uuid4(), name="Org Two", slug="org-two", is_active=True)
        self.db.add_all([self.org1, self.org2])

        # Seed Users
        self.admin_user = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["ORG_ADMIN"].id,
            email="admin@orgone.com",
            password_hash="fake",
            is_active=True,
            is_verified=True,
        )
        self.hr_user = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["HR"].id,
            email="hr@orgone.com",
            password_hash="fake",
            is_active=True,
            is_verified=True,
        )
        self.emp_user = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["EMPLOYEE"].id,
            email="emp@orgone.com",
            password_hash="fake",
            is_active=True,
            is_verified=True,
        )
        self.other_admin = User(
            id=uuid4(),
            organization_id=self.org2.id,
            role_id=self.roles["ORG_ADMIN"].id,
            email="admin@orgtwo.com",
            password_hash="fake",
            is_active=True,
            is_verified=True,
        )
        self.db.add_all([self.admin_user, self.hr_user, self.emp_user, self.other_admin])

        # Seed Department and Employee
        self.dept = Department(id=uuid4(), organization_id=self.org1.id, name="Eng", is_active=True)
        self.db.add(self.dept)

        self.employee = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            user_id=self.emp_user.id,
            department_id=self.dept.id,
            employee_code="EMP-100",
            first_name="Jane",
            last_name="Doe",
            email="emp@orgone.com",
            employment_status="ACTIVE",
            joining_date=date(2026, 1, 1),
        )
        self.db.add(self.employee)
        self.db.commit()

        # Wire up user roles for permissions check
        self.admin_user.role = self.roles["ORG_ADMIN"]
        self.hr_user.role = self.roles["HR"]
        self.emp_user.role = self.roles["EMPLOYEE"]
        self.other_admin.role = self.roles["ORG_ADMIN"]

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def test_01_leave_type_crud_and_tenant_isolation(self):
        """Test LeaveType creation, duplicate prevention, and tenant boundary."""
        # 1. Create Casual Leave
        cl_create = LeaveTypeCreate(
            name="Casual Leave",
            code="CL",
            description="Casual paid time off",
            is_paid=True,
            default_days_per_year=Decimal("12.00"),
        )
        created = create_leave_type(payload=cl_create, db=self.db, current_user=self.admin_user)
        self.assertEqual(created.name, "Casual Leave")
        self.assertEqual(created.code, "CL")
        self.assertEqual(Decimal(str(created.default_days_per_year)), Decimal("12.00"))

        # 2. Duplicate Code in same org -> 409 Conflict
        with self.assertRaises(HTTPException) as ctx:
            create_leave_type(payload=cl_create, db=self.db, current_user=self.admin_user)
        self.assertEqual(ctx.exception.status_code, 409)

        # 3. Same code in another organization -> Allowed (tenant scoped)
        other_cl = create_leave_type(payload=cl_create, db=self.db, current_user=self.other_admin)
        self.assertEqual(other_cl.organization_id, self.org2.id)

        # 4. List Leave Types for Org 1
        types = list_leave_types(db=self.db, current_user=self.admin_user)
        self.assertEqual(len(types), 1)
        self.assertEqual(types[0].id, created.id)

    def test_02_leave_policy_creation(self):
        """Test LeavePolicy definition associated with LeaveType."""
        lt = create_leave_type(
            payload=LeaveTypeCreate(name="Sick Leave", code="SL", is_paid=True, default_days_per_year=Decimal("10.00")),
            db=self.db,
            current_user=self.admin_user,
        )

        pol_create = LeavePolicyCreate(
            leave_type_id=lt.id,
            name="Standard Sick Policy",
            description="10 days per calendar year",
            days_allowed=Decimal("10.00"),
            carry_forward_days=Decimal("2.00"),
            requires_approval=True,
        )
        policy = create_or_update_leave_policy(payload=pol_create, db=self.db, current_user=self.admin_user)
        self.assertEqual(policy.name, "Standard Sick Policy")
        self.assertEqual(Decimal(str(policy.days_allowed)), Decimal("10.00"))

        # List policies
        policies = list_leave_policies(db=self.db, current_user=self.admin_user)
        self.assertEqual(len(policies), 1)
        self.assertEqual(policies[0].leave_type_id, lt.id)

    def test_03_leave_balance_auto_init_and_allocation(self):
        """Test that leave balances auto-initialize and support manual allocation."""
        lt = create_leave_type(
            payload=LeaveTypeCreate(name="Annual Leave", code="AL", is_paid=True, default_days_per_year=Decimal("15.00")),
            db=self.db,
            current_user=self.admin_user,
        )

        # 1. Manual allocation
        alloc = allocate_leave_balance(
            payload=LeaveBalanceCreate(
                employee_id=self.employee.id,
                leave_type_id=lt.id,
                year=2026,
                total_days=Decimal("20.00"),
            ),
            db=self.db,
            current_user=self.admin_user,
        )
        self.assertEqual(Decimal(str(alloc.total_days)), Decimal("20.00"))
        self.assertEqual(Decimal(str(alloc.available_days)), Decimal("20.00"))
        self.assertEqual(Decimal(str(alloc.pending_days)), Decimal("0.00"))
        self.assertEqual(Decimal(str(alloc.used_days)), Decimal("0.00"))

        # 2. Query via /leave-balances
        balances = list_leave_balances(employee_id=self.employee.id, year=2026, db=self.db, current_user=self.admin_user)
        self.assertEqual(len(balances), 1)
        self.assertEqual(balances[0].leave_type_code, "AL")

    def test_04_leave_application_and_balance_hold(self):
        """Test employee applying for leave holding pending days."""
        lt = create_leave_type(
            payload=LeaveTypeCreate(name="Casual Leave", code="CL", is_paid=True, default_days_per_year=Decimal("12.00")),
            db=self.db,
            current_user=self.admin_user,
        )

        # Apply for 3 days: 2026-11-02 to 2026-11-04
        req_create = LeaveRequestCreate(
            leave_type_id=lt.id,
            start_date=date(2026, 11, 2),
            end_date=date(2026, 11, 4),
            reason="Family function",
        )
        leave_req = apply_leave(payload=req_create, db=self.db, current_user=self.emp_user)
        self.assertEqual(leave_req.status, "PENDING")
        self.assertEqual(Decimal(str(leave_req.total_days)), Decimal("3.00"))

        # Check balance: total=12, pending=3, available=9
        bal = leave_service.get_or_create_balance(self.db, self.org1.id, self.employee.id, lt.id, 2026)
        self.assertEqual(Decimal(str(bal.total_days)), Decimal("12.00"))
        self.assertEqual(Decimal(str(bal.pending_days)), Decimal("3.00"))
        self.assertEqual(Decimal(str(bal.available_days)), Decimal("9.00"))

    def test_05_overlapping_leave_request_rejected(self):
        """Test that overlapping leave requests are rejected with HTTP 400."""
        lt = create_leave_type(
            payload=LeaveTypeCreate(name="Casual Leave", code="CL", is_paid=True, default_days_per_year=Decimal("12.00")),
            db=self.db,
            current_user=self.admin_user,
        )

        # First request: Nov 10 to Nov 15
        apply_leave(
            payload=LeaveRequestCreate(
                leave_type_id=lt.id,
                start_date=date(2026, 11, 10),
                end_date=date(2026, 11, 15),
                reason="Trip",
            ),
            db=self.db,
            current_user=self.emp_user,
        )

        # Second request overlapping (Nov 14 to Nov 18) -> must raise 400
        with self.assertRaises(HTTPException) as ctx:
            apply_leave(
                payload=LeaveRequestCreate(
                    leave_type_id=lt.id,
                    start_date=date(2026, 11, 14),
                    end_date=date(2026, 11, 18),
                    reason="Overlap",
                ),
                db=self.db,
                current_user=self.emp_user,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Overlapping", ctx.exception.detail)

    def test_06_insufficient_balance_rejected(self):
        """Test that applying for more days than available is rejected."""
        lt = create_leave_type(
            payload=LeaveTypeCreate(name="Casual Leave", code="CL", is_paid=True, default_days_per_year=Decimal("5.00")),
            db=self.db,
            current_user=self.admin_user,
        )

        # Attempt to apply for 10 days (Nov 1 to Nov 10)
        with self.assertRaises(HTTPException) as ctx:
            apply_leave(
                payload=LeaveRequestCreate(
                    leave_type_id=lt.id,
                    start_date=date(2026, 11, 1),
                    end_date=date(2026, 11, 10),
                    reason="Extended trip",
                ),
                db=self.db,
                current_user=self.emp_user,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Insufficient", ctx.exception.detail)

    def test_07_approval_lifecycle_and_balance_deduction(self):
        """Test approval: pending_days -> used_days with zero double deductions."""
        lt = create_leave_type(
            payload=LeaveTypeCreate(name="Casual Leave", code="CL", is_paid=True, default_days_per_year=Decimal("12.00")),
            db=self.db,
            current_user=self.admin_user,
        )

        req = apply_leave(
            payload=LeaveRequestCreate(
                leave_type_id=lt.id,
                start_date=date(2026, 11, 1),
                end_date=date(2026, 11, 2),  # 2 days
                reason="Appointment",
            ),
            db=self.db,
            current_user=self.emp_user,
        )

        # Approve by HR
        action_payload = LeaveRequestAction(action="APPROVE", action_reason="Approved by HR")
        approved = action_leave_request(request_id=req.id, payload=action_payload, db=self.db, current_user=self.hr_user)
        self.assertEqual(approved.status, "APPROVED")
        self.assertEqual(approved.approver_name, "hr@orgone.com")

        # Balance check: total=12, used=2, pending=0, available=10
        bal = leave_service.get_or_create_balance(self.db, self.org1.id, self.employee.id, lt.id, 2026)
        self.assertEqual(Decimal(str(bal.used_days)), Decimal("2.00"))
        self.assertEqual(Decimal(str(bal.pending_days)), Decimal("0.00"))
        self.assertEqual(Decimal(str(bal.available_days)), Decimal("10.00"))

        # Re-approving already APPROVED request -> 400
        with self.assertRaises(HTTPException) as ctx:
            action_leave_request(request_id=req.id, payload=action_payload, db=self.db, current_user=self.hr_user)
        self.assertEqual(ctx.exception.status_code, 400)

    def test_08_rejection_lifecycle_and_balance_release(self):
        """Test rejection: pending_days released, used_days remains 0."""
        lt = create_leave_type(
            payload=LeaveTypeCreate(name="Casual Leave", code="CL", is_paid=True, default_days_per_year=Decimal("12.00")),
            db=self.db,
            current_user=self.admin_user,
        )

        req = apply_leave(
            payload=LeaveRequestCreate(
                leave_type_id=lt.id,
                start_date=date(2026, 11, 1),
                end_date=date(2026, 11, 3),  # 3 days
                reason="Conference",
            ),
            db=self.db,
            current_user=self.emp_user,
        )

        # Reject by Admin
        action_payload = LeaveRequestAction(action="REJECT", action_reason="Project deadline week")
        rejected = action_leave_request(request_id=req.id, payload=action_payload, db=self.db, current_user=self.admin_user)
        self.assertEqual(rejected.status, "REJECTED")
        self.assertEqual(rejected.action_reason, "Project deadline week")

        # Balance check: pending released, used=0, available=12
        bal = leave_service.get_or_create_balance(self.db, self.org1.id, self.employee.id, lt.id, 2026)
        self.assertEqual(Decimal(str(bal.pending_days)), Decimal("0.00"))
        self.assertEqual(Decimal(str(bal.used_days)), Decimal("0.00"))
        self.assertEqual(Decimal(str(bal.available_days)), Decimal("12.00"))

    def test_09_cancellation_by_employee(self):
        """Test employee cancelling pending request releases balance."""
        lt = create_leave_type(
            payload=LeaveTypeCreate(name="Casual Leave", code="CL", is_paid=True, default_days_per_year=Decimal("12.00")),
            db=self.db,
            current_user=self.admin_user,
        )

        req = apply_leave(
            payload=LeaveRequestCreate(
                leave_type_id=lt.id,
                start_date=date(2026, 11, 1),
                end_date=date(2026, 11, 2),
                reason="Personal",
            ),
            db=self.db,
            current_user=self.emp_user,
        )

        # Cancel
        cancelled = cancel_leave_request(request_id=req.id, db=self.db, current_user=self.emp_user)
        self.assertEqual(cancelled.status, "CANCELLED")

        # Balance check
        bal = leave_service.get_or_create_balance(self.db, self.org1.id, self.employee.id, lt.id, 2026)
        self.assertEqual(Decimal(str(bal.pending_days)), Decimal("0.00"))
        self.assertEqual(Decimal(str(bal.available_days)), Decimal("12.00"))

    def test_10_employee_self_service_history(self):
        """Test employee listing their own leave requests and balances."""
        lt = create_leave_type(
            payload=LeaveTypeCreate(name="Casual Leave", code="CL", is_paid=True, default_days_per_year=Decimal("12.00")),
            db=self.db,
            current_user=self.admin_user,
        )

        apply_leave(
            payload=LeaveRequestCreate(
                leave_type_id=lt.id,
                start_date=date(2026, 11, 1),
                end_date=date(2026, 11, 2),
                reason="Trip 1",
            ),
            db=self.db,
            current_user=self.emp_user,
        )

        my_reqs = list_my_leave_requests(db=self.db, current_user=self.emp_user)
        self.assertEqual(len(my_reqs), 1)
        self.assertEqual(my_reqs[0].reason, "Trip 1")

        my_bals = get_current_user_leave_balances(year=2026, db=self.db, current_user=self.emp_user)
        self.assertEqual(len(my_bals), 1)
        self.assertEqual(my_bals[0].leave_type_code, "CL")


if __name__ == "__main__":
    unittest.main()
