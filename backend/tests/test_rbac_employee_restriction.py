from datetime import date, datetime, time
import unittest
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.v1.departments import list_departments
from app.api.v1.designations import list_designations
from app.api.v1.employees import (
    get_current_employee_profile,
    get_employee,
    list_employees,
)
from app.api.v1.shifts import list_shifts
from app.core.permissions import (
    EMPLOYEE_READ_ROLES,
    SHIFT_READ_ROLES,
    require_roles,
)
from app.db.base import Base
from app.models.department import Department
from app.models.designation import Designation
from app.models.employee import Employee
from app.models.organization import Organization
from app.models.role import Role
from app.models.shift import Shift
from app.models.user import User


class RBACEmployeeRestrictionTestCase(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.db = self.SessionLocal()

        # 1. Seed Roles
        self.roles = {}
        for role_name in ["SUPER_ADMIN", "ORG_ADMIN", "HR", "MANAGER", "EMPLOYEE"]:
            role = Role(id=uuid4(), name=role_name, description=f"{role_name} role")
            self.db.add(role)
            self.roles[role_name] = role

        # 2. Seed Organization
        self.org = Organization(id=uuid4(), name="Acme Corp", slug="acme-corp", is_active=True)
        self.db.add(self.org)

        # 3. Seed Departments
        self.dept_engineering = Department(
            id=uuid4(),
            organization_id=self.org.id,
            name="Engineering",
            description="Engineering Dept",
            is_active=True,
        )
        self.dept_sales = Department(
            id=uuid4(),
            organization_id=self.org.id,
            name="Sales",
            description="Sales Dept",
            is_active=True,
        )
        self.db.add(self.dept_engineering)
        self.db.add(self.dept_sales)

        # 4. Seed Designations
        self.desig_dev = Designation(
            id=uuid4(),
            organization_id=self.org.id,
            department_id=self.dept_engineering.id,
            name="Software Engineer",
            is_active=True,
        )
        self.desig_sales_rep = Designation(
            id=uuid4(),
            organization_id=self.org.id,
            department_id=self.dept_sales.id,
            name="Sales Executive",
            is_active=True,
        )
        self.db.add(self.desig_dev)
        self.db.add(self.desig_sales_rep)

        # 5. Seed Shift
        self.shift = Shift(
            id=uuid4(),
            organization_id=self.org.id,
            name="Regular Shift",
            start_time=time(9, 0),
            end_time=time(18, 0),
            is_active=True,
        )
        self.db.add(self.shift)

        # 6. Seed Admin User
        self.admin_user = User(
            id=uuid4(),
            organization_id=self.org.id,
            role_id=self.roles["ORG_ADMIN"].id,
            email="admin@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.db.add(self.admin_user)

        # 7. Seed HR User
        self.hr_user = User(
            id=uuid4(),
            organization_id=self.org.id,
            role_id=self.roles["HR"].id,
            email="hr@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.db.add(self.hr_user)

        # 8. Seed Manager User & Linked Employee in Engineering
        self.mgr_user = User(
            id=uuid4(),
            organization_id=self.org.id,
            role_id=self.roles["MANAGER"].id,
            email="mgr@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.db.add(self.mgr_user)
        self.mgr_emp = Employee(
            id=uuid4(),
            organization_id=self.org.id,
            user_id=self.mgr_user.id,
            employee_code="MGR-001",
            first_name="Alice",
            last_name="Manager",
            email="mgr@acme.com",
            department_id=self.dept_engineering.id,
            designation_id=self.desig_dev.id,
            employment_status="ACTIVE",
            joining_date=date(2023, 1, 1),
        )
        self.db.add(self.mgr_emp)

        # 9. Seed Regular Employee User & Linked Employee (Piyush) in Engineering
        self.employee_user = User(
            id=uuid4(),
            organization_id=self.org.id,
            role_id=self.roles["EMPLOYEE"].id,
            email="piyush@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.db.add(self.employee_user)
        self.piyush_emp = Employee(
            id=uuid4(),
            organization_id=self.org.id,
            user_id=self.employee_user.id,
            employee_code="EMP-101",
            first_name="Piyush",
            last_name="Sharma",
            email="piyush@acme.com",
            department_id=self.dept_engineering.id,
            designation_id=self.desig_dev.id,
            shift_id=self.shift.id,
            employment_status="ACTIVE",
            joining_date=date(2024, 2, 1),
        )
        self.db.add(self.piyush_emp)

        # 10. Seed Sales Employee
        self.sales_emp = Employee(
            id=uuid4(),
            organization_id=self.org.id,
            user_id=None,
            employee_code="EMP-202",
            first_name="Bob",
            last_name="Salesman",
            email="bob@acme.com",
            department_id=self.dept_sales.id,
            designation_id=self.desig_sales_rep.id,
            employment_status="ACTIVE",
            joining_date=date(2024, 3, 1),
        )
        self.db.add(self.sales_emp)

        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def test_employee_role_cannot_access_employee_read_guard(self):
        """Verify require_roles(*EMPLOYEE_READ_ROLES) returns 403 Forbidden for EMPLOYEE role."""
        guard = require_roles(*EMPLOYEE_READ_ROLES)
        with self.assertRaises(HTTPException) as ctx:
            guard(current_user=self.employee_user, db=self.db)
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Insufficient permissions", ctx.exception.detail)

    def test_employee_role_cannot_access_shift_read_guard(self):
        """Verify require_roles(*SHIFT_READ_ROLES) returns 403 Forbidden for EMPLOYEE role."""
        guard = require_roles(*SHIFT_READ_ROLES)
        with self.assertRaises(HTTPException) as ctx:
            guard(current_user=self.employee_user, db=self.db)
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Insufficient permissions", ctx.exception.detail)

    def test_employee_calling_get_me_returns_own_profile(self):
        """Verify GET /api/v1/employees/me returns the calling employee's own linked profile."""
        profile = get_current_employee_profile(
            current_user=self.employee_user,
            db=self.db,
        )
        self.assertIsNotNone(profile)
        self.assertEqual(profile.id, self.piyush_emp.id)
        self.assertEqual(profile.first_name, "Piyush")
        self.assertEqual(profile.email, "piyush@acme.com")
        self.assertEqual(profile.employee_code, "EMP-101")
        self.assertEqual(profile.department_id, self.dept_engineering.id)

    def test_user_without_linked_employee_calling_get_me_returns_404(self):
        """Verify GET /api/v1/employees/me returns 404 if user has no linked employee profile."""
        orphan_user = User(
            id=uuid4(),
            organization_id=self.org.id,
            role_id=self.roles["EMPLOYEE"].id,
            email="orphan@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.db.add(orphan_user)
        self.db.commit()

        with self.assertRaises(HTTPException) as ctx:
            get_current_employee_profile(
                current_user=orphan_user,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 404)
        self.assertIn("Employee profile not found", ctx.exception.detail)

    def test_admin_and_hr_can_list_employees(self):
        """Verify ORG_ADMIN and HR can list all organization employees."""
        admin_list = list_employees(
            current_user=self.admin_user,
            db=self.db,
        )
        self.assertEqual(len(admin_list), 3)  # mgr_emp, piyush_emp, sales_emp

        hr_list = list_employees(
            current_user=self.hr_user,
            db=self.db,
        )
        self.assertEqual(len(hr_list), 3)

    def test_admin_and_hr_can_read_departments_designations_shifts(self):
        """Verify ORG_ADMIN and HR can access departments, designations, and shifts."""
        depts = list_departments(current_user=self.admin_user, db=self.db)
        self.assertEqual(len(depts), 2)

        desigs = list_designations(current_user=self.hr_user, db=self.db)
        self.assertEqual(len(desigs), 2)

        shifts = list_shifts(current_user=self.admin_user, db=self.db)
        self.assertEqual(len(shifts), 1)

    def test_manager_scoped_to_assigned_department(self):
        """Verify MANAGER can only list employees in their own assigned department."""
        mgr_list = list_employees(
            current_user=self.mgr_user,
            db=self.db,
        )
        # Should only contain Engineering employees (mgr_emp and piyush_emp), NOT sales_emp
        self.assertEqual(len(mgr_list), 2)
        codes = [e.employee_code for e in mgr_list]
        self.assertIn("MGR-001", codes)
        self.assertIn("EMP-101", codes)
        self.assertNotIn("EMP-202", codes)

    def test_manager_cannot_view_other_department_via_param(self):
        """Verify MANAGER cannot bypass scoping by passing another department_id."""
        with self.assertRaises(HTTPException) as ctx:
            list_employees(
                department_id=self.dept_sales.id,
                current_user=self.mgr_user,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Managers can only view employees in their assigned department", ctx.exception.detail)

    def test_manager_get_employee_in_department_succeeds(self):
        """Verify MANAGER can get single employee in their own department."""
        emp = get_employee(
            employee_id=self.piyush_emp.id,
            current_user=self.mgr_user,
            db=self.db,
        )
        self.assertEqual(emp.id, self.piyush_emp.id)

    def test_manager_get_employee_outside_department_returns_403(self):
        """Verify MANAGER receives 403 when attempting to get an employee outside their department."""
        with self.assertRaises(HTTPException) as ctx:
            get_employee(
                employee_id=self.sales_emp.id,
                current_user=self.mgr_user,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Managers can only view employees in their assigned department", ctx.exception.detail)

    def test_manager_without_assigned_department_returns_403(self):
        """Verify MANAGER without assigned department receives 403 Forbidden."""
        unassigned_mgr_user = User(
            id=uuid4(),
            organization_id=self.org.id,
            role_id=self.roles["MANAGER"].id,
            email="unassigned_mgr@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.db.add(unassigned_mgr_user)
        self.db.commit()

        with self.assertRaises(HTTPException) as ctx:
            list_employees(
                current_user=unassigned_mgr_user,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Manager is not assigned to any department", ctx.exception.detail)


if __name__ == "__main__":
    unittest.main()
