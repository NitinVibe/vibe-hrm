import unittest
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine, event
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.api.v1.departments import (
    create_department,
    get_department,
    list_departments,
    update_department,
)
from app.api.v1.designations import (
    create_designation,
    get_designation,
    list_designations,
    update_designation,
)
from app.core.permissions import (
    EMPLOYEE_READ_ROLES,
    EMPLOYEE_WRITE_ROLES,
    require_roles,
)
from app.db.base import Base
from app.main import app
from app.models.department import Department
from app.models.designation import Designation
from app.models.organization import Organization
from app.models.role import Role
from app.models.user import User
from app.schemas.department import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)
from app.schemas.designation import (
    DesignationCreate,
    DesignationResponse,
    DesignationUpdate,
)


class DepartmentDesignationSchemaTestCase(unittest.TestCase):
    def test_department_create_valid(self):
        dept = DepartmentCreate(name="  Engineering  ", description="  Core Tech  ")
        self.assertEqual(dept.name, "Engineering")
        self.assertEqual(dept.description, "Core Tech")
        self.assertTrue(dept.is_active)

    def test_department_create_empty_name_rejected(self):
        with self.assertRaises(ValidationError):
            DepartmentCreate(name="   ")

    def test_department_create_length_limit(self):
        with self.assertRaises(ValidationError):
            DepartmentCreate(name="A" * 101)

    def test_designation_create_valid(self):
        dept_id = uuid4()
        desig = DesignationCreate(
            name="  Software Engineer  ",
            department_id=dept_id,
            description="  Builds things  ",
        )
        self.assertEqual(desig.name, "Software Engineer")
        self.assertEqual(desig.department_id, dept_id)
        self.assertEqual(desig.description, "Builds things")
        self.assertTrue(desig.is_active)

    def test_designation_create_empty_name_rejected(self):
        with self.assertRaises(ValidationError):
            DesignationCreate(name="   ", department_id=uuid4())

    def test_designation_create_length_limit(self):
        with self.assertRaises(ValidationError):
            DesignationCreate(name="B" * 101, department_id=uuid4())

    def test_response_schemas_do_not_expose_sensitive_fields(self):
        dept_fields = set(DepartmentResponse.model_fields.keys())
        desig_fields = set(DesignationResponse.model_fields.keys())

        self.assertIn("id", dept_fields)
        self.assertIn("organization_id", dept_fields)
        self.assertIn("name", dept_fields)
        self.assertNotIn("password_hash", dept_fields)

        self.assertIn("id", desig_fields)
        self.assertIn("organization_id", desig_fields)
        self.assertIn("department_id", desig_fields)
        self.assertIn("name", desig_fields)
        self.assertNotIn("password_hash", desig_fields)


class DepartmentDesignationLogicTestCase(unittest.TestCase):
    def setUp(self):
        # Isolated SQLite in-memory database with foreign keys enabled
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
        self.org1 = Organization(id=uuid4(), name="Org One", slug="org-one", is_active=True)
        self.org2 = Organization(id=uuid4(), name="Org Two", slug="org-two", is_active=True)
        self.db.add_all([self.org1, self.org2])

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
        self.emp_org1 = User(
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

        self.db.add_all([
            self.admin_org1,
            self.hr_org1,
            self.emp_org1,
            self.admin_org2,
        ])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def test_role_authorization_permissions(self):
        write_check = require_roles(*EMPLOYEE_WRITE_ROLES)
        read_check = require_roles(*EMPLOYEE_READ_ROLES)

        # ORG_ADMIN and HR can write
        self.assertEqual(write_check(current_user=self.admin_org1, db=self.db), self.admin_org1)
        self.assertEqual(write_check(current_user=self.hr_org1, db=self.db), self.hr_org1)

        # EMPLOYEE cannot write
        with self.assertRaises(HTTPException) as ctx:
            write_check(current_user=self.emp_org1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 403)

        # EMPLOYEE can read
        self.assertEqual(read_check(current_user=self.emp_org1, db=self.db), self.emp_org1)

    def test_department_crud_and_tenancy(self):
        # 1. Empty list
        dept_list = list_departments(
            search=None, is_active=None, current_user=self.admin_org1, db=self.db
        )
        self.assertEqual(dept_list, [])

        # 2. Create department
        created = create_department(
            payload=DepartmentCreate(name="Engineering", description="Software & DevOps"),
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertIsNotNone(created.id)
        self.assertEqual(created.organization_id, self.org1.id)
        self.assertEqual(created.name, "Engineering")

        # 3. Get department
        fetched = get_department(
            department_id=created.id, current_user=self.admin_org1, db=self.db
        )
        self.assertEqual(fetched.id, created.id)
        self.assertEqual(fetched.name, "Engineering")

        # 4. Update department
        updated = update_department(
            department_id=created.id,
            payload=DepartmentUpdate(description="Product Engineering"),
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertEqual(updated.description, "Product Engineering")

        # 5. Org 2 cannot read Org 1 department
        with self.assertRaises(HTTPException) as ctx:
            get_department(
                department_id=created.id, current_user=self.admin_org2, db=self.db
            )
        self.assertEqual(ctx.exception.status_code, 404)

        # 6. Org 2 cannot update Org 1 department
        with self.assertRaises(HTTPException) as ctx:
            update_department(
                department_id=created.id,
                payload=DepartmentUpdate(name="Hacked"),
                current_user=self.admin_org2,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 404)

    def test_duplicate_department_name_same_org_rejected(self):
        create_department(
            payload=DepartmentCreate(name="Finance"),
            current_user=self.admin_org1,
            db=self.db,
        )

        # Duplicate in same org (case-insensitive) rejected with 409
        with self.assertRaises(HTTPException) as ctx:
            create_department(
                payload=DepartmentCreate(name="finance"),
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 409)

        # Same name in different org allowed
        dept_org2 = create_department(
            payload=DepartmentCreate(name="Finance"),
            current_user=self.admin_org2,
            db=self.db,
        )
        self.assertEqual(dept_org2.organization_id, self.org2.id)

    def test_designation_crud_and_tenancy(self):
        dept1 = create_department(
            payload=DepartmentCreate(name="Engineering"),
            current_user=self.admin_org1,
            db=self.db,
        )

        # 1. Create designation
        desig = create_designation(
            payload=DesignationCreate(
                name="Backend Engineer",
                department_id=dept1.id,
                description="Python & FastAPI",
            ),
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertIsNotNone(desig.id)
        self.assertEqual(desig.organization_id, self.org1.id)
        self.assertEqual(desig.department_id, dept1.id)
        self.assertEqual(desig.name, "Backend Engineer")

        # 2. Get designation
        fetched = get_designation(
            designation_id=desig.id, current_user=self.admin_org1, db=self.db
        )
        self.assertEqual(fetched.id, desig.id)

        # 3. Update designation
        updated = update_designation(
            designation_id=desig.id,
            payload=DesignationUpdate(description="Senior Level"),
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertEqual(updated.description, "Senior Level")

        # 4. Org 2 cannot read Org 1 designation
        with self.assertRaises(HTTPException) as ctx:
            get_designation(
                designation_id=desig.id, current_user=self.admin_org2, db=self.db
            )
        self.assertEqual(ctx.exception.status_code, 404)

        # 5. Org 2 cannot update Org 1 designation
        with self.assertRaises(HTTPException) as ctx:
            update_designation(
                designation_id=desig.id,
                payload=DesignationUpdate(name="Hacked"),
                current_user=self.admin_org2,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 404)

    def test_duplicate_designation_name_same_org_rejected(self):
        dept1 = create_department(
            payload=DepartmentCreate(name="Sales"),
            current_user=self.admin_org1,
            db=self.db,
        )
        create_designation(
            payload=DesignationCreate(name="Account Executive", department_id=dept1.id),
            current_user=self.admin_org1,
            db=self.db,
        )

        # Duplicate in same org rejected with 409
        with self.assertRaises(HTTPException) as ctx:
            create_designation(
                payload=DesignationCreate(
                    name="Account Executive", department_id=dept1.id
                ),
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 409)

        # Same designation name in different org allowed
        dept2 = create_department(
            payload=DepartmentCreate(name="Sales"),
            current_user=self.admin_org2,
            db=self.db,
        )
        desig_org2 = create_designation(
            payload=DesignationCreate(
                name="Account Executive", department_id=dept2.id
            ),
            current_user=self.admin_org2,
            db=self.db,
        )
        self.assertEqual(desig_org2.organization_id, self.org2.id)

    def test_cross_organization_department_assignment_rejected(self):
        dept_org1 = create_department(
            payload=DepartmentCreate(name="Marketing"),
            current_user=self.admin_org1,
            db=self.db,
        )

        # Org 2 attempts to create designation linked to Org 1's department -> 400 Bad Request
        with self.assertRaises(HTTPException) as ctx:
            create_designation(
                payload=DesignationCreate(
                    name="Marketing Lead", department_id=dept_org1.id
                ),
                current_user=self.admin_org2,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)

        # Org 2 creates its own department and designation
        dept_org2 = create_department(
            payload=DepartmentCreate(name="Marketing"),
            current_user=self.admin_org2,
            db=self.db,
        )
        desig_org2 = create_designation(
            payload=DesignationCreate(
                name="Marketing Lead", department_id=dept_org2.id
            ),
            current_user=self.admin_org2,
            db=self.db,
        )

        # Org 2 attempts to PATCH designation to point to Org 1's department -> 400 Bad Request
        with self.assertRaises(HTTPException) as ctx:
            update_designation(
                designation_id=desig_org2.id,
                payload=DesignationUpdate(department_id=dept_org1.id),
                current_user=self.admin_org2,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)

    def test_safe_deactivation_behavior(self):
        dept = create_department(
            payload=DepartmentCreate(name="Operations"),
            current_user=self.admin_org1,
            db=self.db,
        )
        desig = create_designation(
            payload=DesignationCreate(
                name="Operations Manager", department_id=dept.id, is_active=True
            ),
            current_user=self.admin_org1,
            db=self.db,
        )

        # Cannot deactivate department while active designations exist
        with self.assertRaises(HTTPException) as ctx:
            update_department(
                department_id=dept.id,
                payload=DepartmentUpdate(is_active=False),
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("active designation", ctx.exception.detail)

        # Deactivate the designation first
        update_designation(
            designation_id=desig.id,
            payload=DesignationUpdate(is_active=False),
            current_user=self.admin_org1,
            db=self.db,
        )

        # Now department deactivation succeeds safely
        deactivated_dept = update_department(
            department_id=dept.id,
            payload=DepartmentUpdate(is_active=False),
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertFalse(deactivated_dept.is_active)

    def test_search_and_active_filters(self):
        dept1 = create_department(
            payload=DepartmentCreate(name="Alpha Dept", is_active=True),
            current_user=self.admin_org1,
            db=self.db,
        )
        dept2 = create_department(
            payload=DepartmentCreate(name="Beta Dept", is_active=False),
            current_user=self.admin_org1,
            db=self.db,
        )

        # Filter by active
        active_list = list_departments(
            search=None, is_active=True, current_user=self.admin_org1, db=self.db
        )
        self.assertEqual(len(active_list), 1)
        self.assertEqual(active_list[0].id, dept1.id)

        # Filter by inactive
        inactive_list = list_departments(
            search=None, is_active=False, current_user=self.admin_org1, db=self.db
        )
        self.assertEqual(len(inactive_list), 1)
        self.assertEqual(inactive_list[0].id, dept2.id)

        # Search term
        search_list = list_departments(
            search="Alpha", is_active=None, current_user=self.admin_org1, db=self.db
        )
        self.assertEqual(len(search_list), 1)
        self.assertEqual(search_list[0].id, dept1.id)

    def test_cannot_create_or_reassign_designation_to_inactive_department(self):
        # 1. Create an inactive department
        inactive_dept = create_department(
            payload=DepartmentCreate(name="Legacy Department", is_active=False),
            current_user=self.admin_org1,
            db=self.db,
        )

        # 2. Cannot create designation under inactive department
        with self.assertRaises(HTTPException) as ctx:
            create_designation(
                payload=DesignationCreate(
                    name="Legacy Analyst",
                    department_id=inactive_dept.id,
                ),
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("inactive department", ctx.exception.detail)

        # 3. Create an active department and designation
        active_dept = create_department(
            payload=DepartmentCreate(name="Modern Department", is_active=True),
            current_user=self.admin_org1,
            db=self.db,
        )
        desig = create_designation(
            payload=DesignationCreate(
                name="Modern Specialist",
                department_id=active_dept.id,
            ),
            current_user=self.admin_org1,
            db=self.db,
        )

        # 4. Cannot reassign designation to inactive department
        with self.assertRaises(HTTPException) as ctx:
            update_designation(
                designation_id=desig.id,
                payload=DesignationUpdate(department_id=inactive_dept.id),
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("inactive department", ctx.exception.detail)

        # 5. Cannot activate designation if parent department is inactive
        update_designation(
            designation_id=desig.id,
            payload=DesignationUpdate(is_active=False),
            current_user=self.admin_org1,
            db=self.db,
        )
        update_department(
            department_id=active_dept.id,
            payload=DepartmentUpdate(is_active=False),
            current_user=self.admin_org1,
            db=self.db,
        )
        with self.assertRaises(HTTPException) as ctx:
            update_designation(
                designation_id=desig.id,
                payload=DesignationUpdate(is_active=True),
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("inactive department", ctx.exception.detail)

    def test_database_server_defaults(self):
        # Insert department without is_active, created_at, updated_at
        dept = Department(
            id=uuid4(),
            organization_id=self.org1.id,
            name="Raw Defaults Dept",
        )
        self.db.add(dept)
        self.db.commit()
        self.db.refresh(dept)

        self.assertTrue(dept.is_active)
        self.assertIsNotNone(dept.created_at)
        self.assertIsNotNone(dept.updated_at)

    def test_case_insensitive_database_index_enforcement(self):
        # 1. Department case-insensitive uniqueness at database level
        dept1 = Department(
            id=uuid4(),
            organization_id=self.org1.id,
            name="Engineering",
        )
        self.db.add(dept1)
        self.db.commit()

        # Direct DB insert bypassing API with differing casing ("engineering")
        dept2 = Department(
            id=uuid4(),
            organization_id=self.org1.id,
            name="engineering",
        )
        self.db.add(dept2)
        with self.assertRaises(IntegrityError):
            self.db.commit()
        self.db.rollback()

        # 2. Designation case-insensitive uniqueness at database level
        desig1 = Designation(
            id=uuid4(),
            organization_id=self.org1.id,
            department_id=dept1.id,
            name="Tech Lead",
        )
        self.db.add(desig1)
        self.db.commit()

        # Direct DB insert bypassing API with differing casing ("TECH LEAD")
        desig2 = Designation(
            id=uuid4(),
            organization_id=self.org1.id,
            department_id=dept1.id,
            name="TECH LEAD",
        )
        self.db.add(desig2)
        with self.assertRaises(IntegrityError):
            self.db.commit()
        self.db.rollback()


class OpenAPIDepartmentsDesignationsTestCase(unittest.TestCase):
    def test_routes_registered_in_openapi(self):
        paths = app.openapi()["paths"]
        self.assertIn("/api/v1/departments", paths)
        self.assertIn("get", paths["/api/v1/departments"])
        self.assertIn("post", paths["/api/v1/departments"])

        self.assertIn("/api/v1/departments/{department_id}", paths)
        self.assertIn("get", paths["/api/v1/departments/{department_id}"])
        self.assertIn("patch", paths["/api/v1/departments/{department_id}"])

        self.assertIn("/api/v1/designations", paths)
        self.assertIn("get", paths["/api/v1/designations"])
        self.assertIn("post", paths["/api/v1/designations"])

        self.assertIn("/api/v1/designations/{designation_id}", paths)
        self.assertIn("get", paths["/api/v1/designations/{designation_id}"])
        self.assertIn("patch", paths["/api/v1/designations/{designation_id}"])


if __name__ == "__main__":
    unittest.main()
