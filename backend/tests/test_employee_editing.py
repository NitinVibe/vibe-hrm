from datetime import date, timedelta
import unittest
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.v1.employees import (
    create_employee,
    get_employee,
    update_employee,
)
from app.core.permissions import EMPLOYEE_WRITE_ROLES, require_roles
from app.db.base import Base
from app.models.department import Department
from app.models.designation import Designation
from app.models.employee import Employee
from app.models.organization import Organization
from app.models.role import Role
from app.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeUpdate


class EmployeeEditingTestCase(unittest.TestCase):
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

        # Seed organizations
        self.org1 = Organization(id=uuid4(), name="Acme Corp", slug="acme", is_active=True)
        self.org2 = Organization(id=uuid4(), name="Beta Inc", slug="beta", is_active=True)
        self.db.add_all([self.org1, self.org2])

        # Seed users
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
        self.emp_user1 = User(
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
        self.db.add_all([self.admin_org1, self.hr_org1, self.emp_user1, self.admin_org2])

        # Seed departments & designations for org1
        self.dept_eng = Department(id=uuid4(), organization_id=self.org1.id, name="Engineering", is_active=True)
        self.dept_sales = Department(id=uuid4(), organization_id=self.org1.id, name="Sales", is_active=True)
        self.db.add_all([self.dept_eng, self.dept_sales])

        self.desig_dev = Designation(
            id=uuid4(), organization_id=self.org1.id, department_id=self.dept_eng.id, name="Software Engineer", is_active=True
        )
        self.desig_lead = Designation(
            id=uuid4(), organization_id=self.org1.id, department_id=self.dept_eng.id, name="Lead Engineer", is_active=True
        )
        self.db.add_all([self.desig_dev, self.desig_lead])

        # Seed foreign department & designation for org2
        self.dept_org2 = Department(id=uuid4(), organization_id=self.org2.id, name="Operations", is_active=True)
        self.db.add(self.dept_org2)
        self.desig_org2 = Designation(
            id=uuid4(), organization_id=self.org2.id, department_id=self.dept_org2.id, name="Ops Lead", is_active=True
        )
        self.db.add(self.desig_org2)

        self.db.commit()

        # Seed sample employee in org1
        self.employee = create_employee(
            payload=EmployeeCreate(
                employee_code="EMP-001",
                first_name="Jane",
                last_name="Doe",
                email="jane.doe@acme.com",
                phone="+1-555-1234",
                date_of_birth=date(1992, 4, 10),
                joining_date=date(2023, 6, 1),
                employment_status="ACTIVE",
                department_id=self.dept_eng.id,
                designation_id=self.desig_dev.id,
            ),
            current_user=self.admin_org1,
            db=self.db,
        )

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def test_update_joining_date_persists_successfully(self):
        new_joining_date = date(2023, 1, 15)
        updated = update_employee(
            employee_id=self.employee.id,
            payload=EmployeeUpdate(joining_date=new_joining_date),
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertEqual(updated.joining_date, new_joining_date)

        # Verify persisted state from fresh DB read
        fetched = get_employee(employee_id=self.employee.id, current_user=self.admin_org1, db=self.db)
        self.assertEqual(fetched.joining_date, new_joining_date)

    def test_update_department_and_designation(self):
        updated = update_employee(
            employee_id=self.employee.id,
            payload=EmployeeUpdate(
                department_id=self.dept_eng.id,
                designation_id=self.desig_lead.id,
                employment_status="PROBATION",
            ),
            current_user=self.hr_org1,
            db=self.db,
        )
        self.assertEqual(updated.designation_id, self.desig_lead.id)
        self.assertEqual(updated.designation_name, "Lead Engineer")
        self.assertEqual(updated.employment_status, "PROBATION")

    def test_empty_string_sanitization_for_optional_fields(self):
        # Passing empty strings should not fail validation; should sanitize to None
        update_data = EmployeeUpdate.model_validate({
            "department_id": "",
            "designation_id": "",
            "phone": "",
        })
        self.assertIsNone(update_data.department_id)
        self.assertIsNone(update_data.designation_id)
        self.assertIsNone(update_data.phone)

    def test_future_date_of_birth_rejected(self):
        tomorrow = date.today() + timedelta(days=1)
        with self.assertRaises(ValidationError) as ctx:
            EmployeeUpdate(date_of_birth=tomorrow)
        self.assertIn("cannot be in the future", str(ctx.exception))

    def test_joining_date_before_dob_rejected(self):
        with self.assertRaises(ValidationError) as ctx:
            EmployeeCreate(
                employee_code="EMP-TEST",
                first_name="Test",
                date_of_birth=date(2000, 1, 1),
                joining_date=date(1995, 1, 1),
            )
        self.assertIn("Joining date must be after date of birth", str(ctx.exception))

    def test_foreign_department_rejected(self):
        # Attempting to assign department from another org must fail
        with self.assertRaises(HTTPException) as ctx:
            update_employee(
                employee_id=self.employee.id,
                payload=EmployeeUpdate(department_id=self.dept_org2.id),
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)

    def test_foreign_designation_rejected(self):
        # Attempting to assign designation from another org must fail
        with self.assertRaises(HTTPException) as ctx:
            update_employee(
                employee_id=self.employee.id,
                payload=EmployeeUpdate(designation_id=self.desig_org2.id),
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)

    def test_mismatched_department_designation_rejected(self):
        # desig_dev belongs to dept_eng; assigning dept_sales with desig_dev must fail
        with self.assertRaises(HTTPException) as ctx:
            update_employee(
                employee_id=self.employee.id,
                payload=EmployeeUpdate(department_id=self.dept_sales.id, designation_id=self.desig_dev.id),
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)

    def test_cross_tenant_update_prevented(self):
        # Admin from org2 cannot edit employee of org1 (returns 404)
        with self.assertRaises(HTTPException) as ctx:
            update_employee(
                employee_id=self.employee.id,
                payload=EmployeeUpdate(first_name="Intruder"),
                current_user=self.admin_org2,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 404)

        # Confirm employee remains unchanged
        fetched = get_employee(employee_id=self.employee.id, current_user=self.admin_org1, db=self.db)
        self.assertEqual(fetched.first_name, "Jane")

    def test_employee_role_cannot_update(self):
        # Employee role cannot call update_employee (fails require_roles check)
        write_check = require_roles(*EMPLOYEE_WRITE_ROLES)
        with self.assertRaises(HTTPException) as ctx:
            write_check(current_user=self.emp_user1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
