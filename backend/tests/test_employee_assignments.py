from datetime import date
import os
from pathlib import Path
import subprocess
import sys
import unittest
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine, event
from sqlalchemy.orm import configure_mappers, sessionmaker

from app.api.v1.departments import update_department
from app.api.v1.designations import update_designation
from app.api.v1.employees import (
    create_employee,
    get_employee,
    list_employees,
    update_employee,
)
from app.db.base import Base
from app.models.department import Department
from app.models.designation import Designation
from app.models.employee import Employee
from app.models.organization import Organization
from app.models.role import Role
from app.models.user import User
from app.schemas.department import DepartmentUpdate
from app.schemas.designation import DesignationUpdate
from app.schemas.employee import EmployeeCreate, EmployeeUpdate


class EmployeeAssignmentTestCase(unittest.TestCase):
    def setUp(self):
        # Configure in-memory SQLite with foreign keys
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

        # Seed Admin User for Org 1
        self.admin_org1 = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["ORG_ADMIN"].id,
            email="admin@acme.com",
            password_hash="fakehash",
            is_active=True,
            is_verified=True,
        )
        self.db.add(self.admin_org1)

        # Seed Departments for Org 1
        self.dept_eng = Department(
            id=uuid4(),
            organization_id=self.org1.id,
            name="Engineering",
            description="Software Engineering",
            is_active=True,
        )
        self.dept_hr = Department(
            id=uuid4(),
            organization_id=self.org1.id,
            name="Human Resources",
            description="People Ops",
            is_active=True,
        )
        self.dept_inactive = Department(
            id=uuid4(),
            organization_id=self.org1.id,
            name="Legacy Dept",
            description="Deprecated",
            is_active=False,
        )
        # Seed Department for Org 2
        self.dept_org2 = Department(
            id=uuid4(),
            organization_id=self.org2.id,
            name="Beta Engineering",
            is_active=True,
        )
        self.db.add_all([self.dept_eng, self.dept_hr, self.dept_inactive, self.dept_org2])

        # Seed Designations for Org 1
        self.desig_dev = Designation(
            id=uuid4(),
            organization_id=self.org1.id,
            department_id=self.dept_eng.id,
            name="Software Engineer",
            is_active=True,
        )
        self.desig_lead = Designation(
            id=uuid4(),
            organization_id=self.org1.id,
            department_id=self.dept_eng.id,
            name="Tech Lead",
            is_active=True,
        )
        self.desig_hr_gen = Designation(
            id=uuid4(),
            organization_id=self.org1.id,
            department_id=self.dept_hr.id,
            name="HR Generalist",
            is_active=True,
        )
        self.desig_inactive = Designation(
            id=uuid4(),
            organization_id=self.org1.id,
            department_id=self.dept_eng.id,
            name="Intern Engineer",
            is_active=False,
        )
        # Seed Designation for Org 2
        self.desig_org2 = Designation(
            id=uuid4(),
            organization_id=self.org2.id,
            department_id=self.dept_org2.id,
            name="Beta Dev",
            is_active=True,
        )
        self.db.add_all([
            self.desig_dev,
            self.desig_lead,
            self.desig_hr_gen,
            self.desig_inactive,
            self.desig_org2,
        ])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def test_sqlalchemy_mappers_configuration(self):
        """Verify all SQLAlchemy models and relationships configure cleanly without mapper ambiguity."""
        configure_mappers()
        emp = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            employee_code="TEST-001",
            first_name="Mapper",
            department_id=self.dept_eng.id,
            designation_id=self.desig_dev.id,
        )
        self.db.add(emp)
        self.db.commit()

        loaded = self.db.query(Employee).filter_by(id=emp.id).first()
        self.assertEqual(loaded.department.name, "Engineering")
        self.assertEqual(loaded.designation.name, "Software Engineer")
        self.assertEqual(loaded.department_name, "Engineering")
        self.assertEqual(loaded.designation_name, "Software Engineer")
        self.assertIn(loaded, self.dept_eng.employees)
        self.assertIn(loaded, self.desig_dev.employees)

    def test_employee_create_unassigned(self):
        """Create employee with neither department nor designation assigned."""
        payload = EmployeeCreate(
            employee_code="EMP-UNASSIGNED",
            first_name="Jane",
            last_name="Doe",
        )
        emp = create_employee(payload, current_user=self.admin_org1, db=self.db)
        self.assertIsNone(emp.department_id)
        self.assertIsNone(emp.designation_id)
        self.assertIsNone(emp.department_name)
        self.assertIsNone(emp.designation_name)

    def test_employee_create_department_only(self):
        """Create employee with active department only."""
        payload = EmployeeCreate(
            employee_code="EMP-DEPT-ONLY",
            first_name="John",
            department_id=self.dept_eng.id,
            designation_id=None,
        )
        emp = create_employee(payload, current_user=self.admin_org1, db=self.db)
        self.assertEqual(emp.department_id, self.dept_eng.id)
        self.assertIsNone(emp.designation_id)
        self.assertEqual(emp.department_name, "Engineering")
        self.assertIsNone(emp.designation_name)

    def test_employee_create_valid_assignment(self):
        """Create employee with valid active department and matching designation."""
        payload = EmployeeCreate(
            employee_code="EMP-ASSIGNED",
            first_name="Alice",
            department_id=self.dept_eng.id,
            designation_id=self.desig_dev.id,
        )
        emp = create_employee(payload, current_user=self.admin_org1, db=self.db)
        self.assertEqual(emp.department_id, self.dept_eng.id)
        self.assertEqual(emp.designation_id, self.desig_dev.id)
        self.assertEqual(emp.department_name, "Engineering")
        self.assertEqual(emp.designation_name, "Software Engineer")

    def test_employee_create_designation_without_department_schema_rejected(self):
        """Pydantic model validator rejects designation_id when department_id is None."""
        with self.assertRaises(ValidationError):
            EmployeeCreate(
                employee_code="EMP-FAIL",
                first_name="Bob",
                department_id=None,
                designation_id=self.desig_dev.id,
            )

    def test_employee_create_nonexistent_department_rejected(self):
        """API rejects nonexistent department."""
        fake_dept_id = uuid4()
        payload = EmployeeCreate(
            employee_code="EMP-NONEXIST-DEPT",
            first_name="Bob",
            department_id=fake_dept_id,
        )
        with self.assertRaises(HTTPException) as ctx:
            create_employee(payload, current_user=self.admin_org1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("does not exist", ctx.exception.detail)

    def test_employee_create_nonexistent_designation_rejected(self):
        """API rejects nonexistent designation."""
        fake_desig_id = uuid4()
        payload = EmployeeCreate(
            employee_code="EMP-NONEXIST-DESIG",
            first_name="Bob",
            department_id=self.dept_eng.id,
            designation_id=fake_desig_id,
        )
        with self.assertRaises(HTTPException) as ctx:
            create_employee(payload, current_user=self.admin_org1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("does not exist", ctx.exception.detail)

    def test_employee_create_cross_organization_department_rejected(self):
        """API rejects department from another tenant."""
        payload = EmployeeCreate(
            employee_code="EMP-CROSS-DEPT",
            first_name="Bob",
            department_id=self.dept_org2.id,
        )
        with self.assertRaises(HTTPException) as ctx:
            create_employee(payload, current_user=self.admin_org1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("does not exist in this organization", ctx.exception.detail)

    def test_employee_create_cross_organization_designation_rejected(self):
        """API rejects designation from another tenant."""
        payload = EmployeeCreate(
            employee_code="EMP-CROSS-DESIG",
            first_name="Bob",
            department_id=self.dept_eng.id,
            designation_id=self.desig_org2.id,
        )
        with self.assertRaises(HTTPException) as ctx:
            create_employee(payload, current_user=self.admin_org1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("does not exist in this organization", ctx.exception.detail)

    def test_employee_create_mismatched_department_designation_rejected(self):
        """API rejects designation belonging to a different department."""
        payload = EmployeeCreate(
            employee_code="EMP-MISMATCH",
            first_name="Bob",
            department_id=self.dept_eng.id,
            designation_id=self.desig_hr_gen.id,  # HR designation with Engineering dept
        )
        with self.assertRaises(HTTPException) as ctx:
            create_employee(payload, current_user=self.admin_org1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("does not belong to the selected department", ctx.exception.detail)

    def test_employee_create_inactive_department_rejected(self):
        """API rejects assigning inactive department."""
        payload = EmployeeCreate(
            employee_code="EMP-INACT-DEPT",
            first_name="Bob",
            department_id=self.dept_inactive.id,
        )
        with self.assertRaises(HTTPException) as ctx:
            create_employee(payload, current_user=self.admin_org1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("inactive department", ctx.exception.detail)

    def test_employee_create_inactive_designation_rejected(self):
        """API rejects assigning inactive designation."""
        payload = EmployeeCreate(
            employee_code="EMP-INACT-DESIG",
            first_name="Bob",
            department_id=self.dept_eng.id,
            designation_id=self.desig_inactive.id,
        )
        with self.assertRaises(HTTPException) as ctx:
            create_employee(payload, current_user=self.admin_org1, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("inactive designation", ctx.exception.detail)

    def test_employee_update_clear_assignments(self):
        """Clearing both department and designation on existing employee."""
        created = create_employee(
            EmployeeCreate(
                employee_code="EMP-CLEAR",
                first_name="Claire",
                department_id=self.dept_eng.id,
                designation_id=self.desig_dev.id,
            ),
            current_user=self.admin_org1,
            db=self.db,
        )
        updated = update_employee(
            created.id,
            EmployeeUpdate(department_id=None, designation_id=None),
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertIsNone(updated.department_id)
        self.assertIsNone(updated.designation_id)
        self.assertIsNone(updated.department_name)
        self.assertIsNone(updated.designation_name)

    def test_employee_update_clear_designation_only(self):
        """Clearing designation while retaining department."""
        created = create_employee(
            EmployeeCreate(
                employee_code="EMP-CLEAR-DESIG",
                first_name="David",
                department_id=self.dept_eng.id,
                designation_id=self.desig_dev.id,
            ),
            current_user=self.admin_org1,
            db=self.db,
        )
        updated = update_employee(
            created.id,
            EmployeeUpdate(designation_id=None),
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertEqual(updated.department_id, self.dept_eng.id)
        self.assertIsNone(updated.designation_id)
        self.assertEqual(updated.department_name, "Engineering")
        self.assertIsNone(updated.designation_name)

    def test_employee_update_change_department_and_compatible_designation(self):
        """Reassigning employee to a new department with a compatible designation."""
        created = create_employee(
            EmployeeCreate(
                employee_code="EMP-TRANSFER",
                first_name="Emma",
                department_id=self.dept_eng.id,
                designation_id=self.desig_dev.id,
            ),
            current_user=self.admin_org1,
            db=self.db,
        )
        updated = update_employee(
            created.id,
            EmployeeUpdate(
                department_id=self.dept_hr.id,
                designation_id=self.desig_hr_gen.id,
            ),
            current_user=self.admin_org1,
            db=self.db,
        )
        self.assertEqual(updated.department_id, self.dept_hr.id)
        self.assertEqual(updated.designation_id, self.desig_hr_gen.id)
        self.assertEqual(updated.department_name, "Human Resources")
        self.assertEqual(updated.designation_name, "HR Generalist")

    def test_employee_update_change_department_without_handling_designation_rejected(self):
        """Partial update that changes department while leaving incompatible designation is rejected."""
        created = create_employee(
            EmployeeCreate(
                employee_code="EMP-PARTIAL-FAIL",
                first_name="Frank",
                department_id=self.dept_eng.id,
                designation_id=self.desig_dev.id,
            ),
            current_user=self.admin_org1,
            db=self.db,
        )
        # Only change department to HR, omitting designation_id
        with self.assertRaises(HTTPException) as ctx:
            update_employee(
                created.id,
                EmployeeUpdate(department_id=self.dept_hr.id),
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Changing department requires", ctx.exception.detail)

    def test_employee_update_remove_department_without_clearing_designation_rejected(self):
        """Removing department while leaving designation attached is rejected."""
        created = create_employee(
            EmployeeCreate(
                employee_code="EMP-REMOVE-DEPT-FAIL",
                first_name="Grace",
                department_id=self.dept_eng.id,
                designation_id=self.desig_dev.id,
            ),
            current_user=self.admin_org1,
            db=self.db,
        )
        # Attempt to set department_id to None without clearing designation_id
        with self.assertRaises(HTTPException) as ctx:
            update_employee(
                created.id,
                EmployeeUpdate(department_id=None),
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Cannot assign or keep a designation without a department", ctx.exception.detail)

    def test_employee_directory_filter_by_department(self):
        """Filter employee directory by department_id."""
        create_employee(
            EmployeeCreate(
                employee_code="EMP-D1",
                first_name="Eng1",
                department_id=self.dept_eng.id,
                designation_id=self.desig_dev.id,
            ),
            current_user=self.admin_org1,
            db=self.db,
        )
        create_employee(
            EmployeeCreate(
                employee_code="EMP-D2",
                first_name="Hr1",
                department_id=self.dept_hr.id,
                designation_id=self.desig_hr_gen.id,
            ),
            current_user=self.admin_org1,
            db=self.db,
        )
        # List all
        all_emps = list_employees(current_user=self.admin_org1, db=self.db)
        self.assertEqual(len(all_emps), 2)

        # Filter by Engineering
        eng_emps = list_employees(department_id=self.dept_eng.id, current_user=self.admin_org1, db=self.db)
        self.assertEqual(len(eng_emps), 1)
        self.assertEqual(eng_emps[0].employee_code, "EMP-D1")

    def test_deactivate_department_with_active_employee_rejected(self):
        """Department cannot be deactivated while an active employee is assigned to it."""
        create_employee(
            EmployeeCreate(
                employee_code="EMP-ACTIVE-DEPT",
                first_name="ActiveWorker",
                department_id=self.dept_eng.id,
                employment_status="ACTIVE",
            ),
            current_user=self.admin_org1,
            db=self.db,
        )
        with self.assertRaises(HTTPException) as ctx:
            update_department(
                self.dept_eng.id,
                DepartmentUpdate(is_active=False),
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Cannot deactivate department", ctx.exception.detail)

    def test_deactivate_designation_with_active_employee_rejected(self):
        """Designation cannot be deactivated while an active employee is assigned to it."""
        create_employee(
            EmployeeCreate(
                employee_code="EMP-ACTIVE-DESIG",
                first_name="ActiveDev",
                department_id=self.dept_eng.id,
                designation_id=self.desig_dev.id,
                employment_status="ACTIVE",
            ),
            current_user=self.admin_org1,
            db=self.db,
        )
        with self.assertRaises(HTTPException) as ctx:
            update_designation(
                self.desig_dev.id,
                DesignationUpdate(is_active=False),
                current_user=self.admin_org1,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Cannot deactivate designation", ctx.exception.detail)


class MigrationStructureTestCase(unittest.TestCase):
    def test_offline_sql_generation(self):
        """Ensure alembic upgrade and downgrade static SQL generate cleanly."""
        backend_dir = Path(__file__).resolve().parent.parent
        env = os.environ.copy()
        env["DATABASE_URL"] = "postgresql://test_user:test_pass@localhost:5432/test_db"
        upgrade_res = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "0650ac39674b:e93c4c5a856d", "--sql"],
            cwd=str(backend_dir),
            env=env,
            capture_output=True,
            text=True,
        )
        self.assertEqual(upgrade_res.returncode, 0, f"Alembic upgrade --sql failed: {upgrade_res.stderr}")
        self.assertIn("fk_employees_department_org", upgrade_res.stdout)
        self.assertIn("fk_employees_designation_org", upgrade_res.stdout)
        self.assertIn("fk_employees_designation_dept_org", upgrade_res.stdout)
        self.assertIn("ck_employees_designation_requires_department", upgrade_res.stdout)

        downgrade_res = subprocess.run(
            [sys.executable, "-m", "alembic", "downgrade", "e93c4c5a856d:0650ac39674b", "--sql"],
            cwd=str(backend_dir),
            env=env,
            capture_output=True,
            text=True,
        )
        self.assertEqual(downgrade_res.returncode, 0, f"Alembic downgrade --sql failed: {downgrade_res.stderr}")
        self.assertIn("DROP CONSTRAINT fk_employees_department_org", downgrade_res.stdout)
        self.assertIn("DROP CONSTRAINT ck_employees_designation_requires_department", downgrade_res.stdout)
