from datetime import date, datetime
import unittest
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.v1.employees import (
    create_employee,
    get_employee,
    list_employees,
    update_employee,
)
from app.core.permissions import (
    EMPLOYEE_READ_ROLES,
    EMPLOYEE_WRITE_ROLES,
    require_roles,
)
from app.db.base import Base
from app.main import app
from app.models.employee import Employee
from app.models.organization import Organization
from app.models.role import Role
from app.models.user import User
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeResponse,
    EmployeeUpdate,
)


class EmployeeSchemaValidationTestCase(unittest.TestCase):
    def test_valid_employee_create(self):
        data = EmployeeCreate(
            employee_code=" EMP-001 ",
            first_name=" John ",
            last_name=" Doe ",
            email="john.doe@example.com",
            phone=" +1-555-0100 ",
            date_of_birth=date(1990, 5, 15),
            joining_date=date(2024, 1, 10),
            employment_status="ACTIVE",
        )
        self.assertEqual(data.employee_code, "EMP-001")
        self.assertEqual(data.first_name, "John")
        self.assertEqual(data.last_name, "Doe")
        self.assertEqual(data.phone, "+1-555-0100")

    def test_empty_required_fields_rejected(self):
        with self.assertRaises(ValidationError):
            EmployeeCreate(
                employee_code="   ",
                first_name="Valid",
            )
        with self.assertRaises(ValidationError):
            EmployeeCreate(
                employee_code="EMP-001",
                first_name="   ",
            )

    def test_invalid_email_rejected(self):
        with self.assertRaises(ValidationError):
            EmployeeCreate(
                employee_code="EMP-001",
                first_name="John",
                email="not-an-email",
            )

    def test_max_length_constraints(self):
        with self.assertRaises(ValidationError):
            EmployeeCreate(
                employee_code="A" * 51,
                first_name="John",
            )
        with self.assertRaises(ValidationError):
            EmployeeCreate(
                employee_code="EMP-001",
                first_name="B" * 101,
            )

    def test_update_schema_rejects_empty_when_provided(self):
        with self.assertRaises(ValidationError):
            EmployeeUpdate(first_name="   ")
        with self.assertRaises(ValidationError):
            EmployeeUpdate(employee_code="   ")

    def test_response_schema_fields(self):
        fields = list(EmployeeResponse.model_fields.keys())
        self.assertIn("id", fields)
        self.assertIn("organization_id", fields)
        self.assertIn("employee_code", fields)
        self.assertIn("first_name", fields)
        self.assertIn("last_name", fields)
        self.assertIn("email", fields)
        self.assertIn("phone", fields)
        self.assertIn("created_at", fields)
        self.assertIn("updated_at", fields)
        self.assertIn("department_id", fields)
        self.assertIn("designation_id", fields)
        self.assertIn("department_name", fields)
        self.assertIn("designation_name", fields)
        # Verify no credentials or unsupported fields
        self.assertNotIn("password_hash", fields)
        self.assertNotIn("gender", fields)


class EmployeeEndpointLogicTestCase(unittest.TestCase):
    def setUp(self):
        # Isolated SQLite in-memory database
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
        self.org1 = Organization(id=uuid4(), name="Org One", slug="org-one", is_active=True)
        self.org2 = Organization(id=uuid4(), name="Org Two", slug="org-two", is_active=True)
        self.db.add(self.org1)
        self.db.add(self.org2)

        # Seed Users
        self.admin_org1 = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["ORG_ADMIN"].id,
            email="admin@org1.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.hr_org1 = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["HR"].id,
            email="hr@org1.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.employee_org1 = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["EMPLOYEE"].id,
            email="emp@org1.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.admin_org2 = User(
            id=uuid4(),
            organization_id=self.org2.id,
            role_id=self.roles["ORG_ADMIN"].id,
            email="admin@org2.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.unlinked_user_org1 = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["EMPLOYEE"].id,
            email="unlinked@org1.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )

        self.db.add_all([
            self.admin_org1,
            self.hr_org1,
            self.employee_org1,
            self.admin_org2,
            self.unlinked_user_org1,
        ])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def test_role_authorization_dependency(self):
        write_check = require_roles(*EMPLOYEE_WRITE_ROLES)
        read_check = require_roles(*EMPLOYEE_READ_ROLES)

        # EMPLOYEE role cannot write
        with self.assertRaises(HTTPException) as ctx:
            write_check(current_user=self.employee_org1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 403)

        # ORG_ADMIN and HR can write
        self.assertEqual(write_check(current_user=self.admin_org1, db=self.db), self.admin_org1)
        self.assertEqual(write_check(current_user=self.hr_org1, db=self.db), self.hr_org1)

        # EMPLOYEE role cannot read employee directory
        with self.assertRaises(HTTPException) as ctx:
            read_check(current_user=self.employee_org1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 403)

        # ORG_ADMIN and HR can read
        self.assertEqual(read_check(current_user=self.admin_org1, db=self.db), self.admin_org1)
        self.assertEqual(read_check(current_user=self.hr_org1, db=self.db), self.hr_org1)

    def test_empty_employee_list(self):
        res = list_employees(
            search=None,
            status_filter=None,
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertEqual(res, [])

    def test_create_and_get_employee(self):
        payload = EmployeeCreate(
            employee_code="EMP-100",
            first_name="Alice",
            last_name="Smith",
            email="alice@org1.com",
            phone="+123456789",
            employment_status="ACTIVE",
        )
        created = create_employee(
            payload=payload,
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertIsNotNone(created.id)
        self.assertEqual(created.organization_id, self.org1.id)
        self.assertEqual(created.employee_code, "EMP-100")
        self.assertEqual(created.first_name, "Alice")

        # Retrieve employee
        fetched = get_employee(
            employee_id=created.id,
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertEqual(fetched.id, created.id)
        self.assertEqual(fetched.employee_code, "EMP-100")

    def test_duplicate_employee_code_same_org_rejected(self):
        payload1 = EmployeeCreate(
            employee_code="EMP-101",
            first_name="Bob",
        )
        create_employee(payload=payload1, current_user=self.admin_org1, db=self.db)

        payload2 = EmployeeCreate(
            employee_code="EMP-101",
            first_name="Charlie",
        )
        with self.assertRaises(HTTPException) as ctx:
            create_employee(payload=payload2, current_user=self.admin_org1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 409)

    def test_cross_organization_isolation(self):
        # Create EMP-200 in Org 1
        emp1 = create_employee(
            payload=EmployeeCreate(employee_code="EMP-200", first_name="Dave"),
            current_user=self.admin_org1,
            db=self.db,
        )

        # Same employee_code EMP-200 in Org 2 is permitted
        emp2 = create_employee(
            payload=EmployeeCreate(employee_code="EMP-200", first_name="Eve"),
            current_user=self.admin_org2,
            db=self.db,
        )
        self.assertEqual(emp2.organization_id, self.org2.id)

        # Org 1 list only returns emp1
        list_org1 = list_employees(
            search=None, status_filter=None, current_user=self.admin_org1, db=self.db
        )
        self.assertEqual(len(list_org1), 1)
        self.assertEqual(list_org1[0].id, emp1.id)

        # Org 2 user cannot read emp1
        with self.assertRaises(HTTPException) as ctx:
            get_employee(employee_id=emp1.id, current_user=self.admin_org2, db=self.db)
        self.assertEqual(ctx.exception.status_code, 404)

        # Org 2 user cannot update emp1
        with self.assertRaises(HTTPException) as ctx:
            update_employee(
                employee_id=emp1.id,
                payload=EmployeeUpdate(first_name="Hacked"),
                current_user=self.admin_org2,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 404)

    def test_update_employee_fields(self):
        emp = create_employee(
            payload=EmployeeCreate(
                employee_code="EMP-300",
                first_name="Frank",
                last_name="Miller",
                employment_status="ACTIVE",
            ),
            current_user=self.admin_org1,
            db=self.db,
        )
        initial_updated_at = emp.updated_at

        # Update first_name and status only
        updated = update_employee(
            employee_id=emp.id,
            payload=EmployeeUpdate(first_name="Franklin", employment_status="ON_LEAVE"),
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertEqual(updated.first_name, "Franklin")
        self.assertEqual(updated.last_name, "Miller")  # Unchanged
        self.assertEqual(updated.employment_status, "ON_LEAVE")
        self.assertGreaterEqual(updated.updated_at, initial_updated_at)

    def test_user_link_validation(self):
        # 1. Valid user link in same org
        emp = create_employee(
            payload=EmployeeCreate(
                employee_code="EMP-400",
                first_name="Grace",
                user_id=self.unlinked_user_org1.id,
            ),
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertEqual(emp.user_id, self.unlinked_user_org1.id)

        # 2. Cannot link same user to another employee (already linked)
        with self.assertRaises(HTTPException) as ctx:
            create_employee(
                payload=EmployeeCreate(
                    employee_code="EMP-401",
                    first_name="Henry",
                    user_id=self.unlinked_user_org1.id,
                ),
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 409)

        # 3. Cannot link user from another organization
        with self.assertRaises(HTTPException) as ctx:
            create_employee(
                payload=EmployeeCreate(
                    employee_code="EMP-402",
                    first_name="Ian",
                    user_id=self.admin_org2.id,
                ),
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)


class OpenAPIEmployeeEndpointsTestCase(unittest.TestCase):
    def test_endpoints_registered_in_openapi_schema(self):
        paths = app.openapi()["paths"]
        self.assertIn("/api/v1/employees", paths)
        self.assertIn("get", paths["/api/v1/employees"])
        self.assertIn("post", paths["/api/v1/employees"])

        self.assertIn("/api/v1/employees/{employee_id}", paths)
        self.assertIn("get", paths["/api/v1/employees/{employee_id}"])
        self.assertIn("patch", paths["/api/v1/employees/{employee_id}"])


if __name__ == "__main__":
    unittest.main()
