from datetime import date, datetime
import unittest
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.api.v1.employees import (
    create_employee_account,
    get_employee_account_status,
    reset_employee_password,
)
from app.core.security import verify_password
from app.db.base import Base
from app.models.employee import Employee
from app.models.organization import Organization
from app.models.role import Role
from app.models.user import User
from app.schemas.employee import (
    EmployeeAccountCreate,
    EmployeeAccountStatusResponse,
    EmployeePasswordReset,
)


class EmployeeAccountSchemasTestCase(unittest.TestCase):
    def test_account_create_valid(self):
        payload = EmployeeAccountCreate(
            password="SecurePassword123!",
            email="employee@example.com",
            role_name="EMPLOYEE",
        )
        self.assertEqual(payload.password, "SecurePassword123!")
        self.assertEqual(payload.email, "employee@example.com")
        self.assertEqual(payload.role_name, "EMPLOYEE")

    def test_account_create_short_password_rejected(self):
        with self.assertRaises(ValidationError):
            EmployeeAccountCreate(password="short")

    def test_password_reset_valid(self):
        payload = EmployeePasswordReset(password="NewSecurePassword123!")
        self.assertEqual(payload.password, "NewSecurePassword123!")

    def test_password_reset_short_password_rejected(self):
        with self.assertRaises(ValidationError):
            EmployeePasswordReset(password="1234567")


class EmployeeAccountProvisioningTestCase(unittest.TestCase):
    def setUp(self):
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

        # Seed Admin user for Org1
        self.admin_user = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["ORG_ADMIN"].id,
            email="admin@org1.com",
            password_hash="fakeadminhash",
            is_active=True,
            is_verified=True,
        )
        self.db.add(self.admin_user)

        # Seed HR user for Org1
        self.hr_user = User(
            id=uuid4(),
            organization_id=self.org1.id,
            role_id=self.roles["HR"].id,
            email="hr@org1.com",
            password_hash="fakehrhash",
            is_active=True,
            is_verified=True,
        )
        self.db.add(self.hr_user)

        # Seed Employee for Org1 without User account
        self.emp1 = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            user_id=None,
            employee_code="EMP-001",
            first_name="Jane",
            last_name="Doe",
            email="jane.doe@org1.com",
            phone="+1234567890",
            employment_status="ACTIVE",
            joining_date=date(2024, 1, 1),
        )
        self.db.add(self.emp1)

        # Seed Employee for Org2
        self.emp2_org2 = Employee(
            id=uuid4(),
            organization_id=self.org2.id,
            user_id=None,
            employee_code="EMP-ORG2-001",
            first_name="Bob",
            last_name="Smith",
            email="bob@org2.com",
            employment_status="ACTIVE",
        )
        self.db.add(self.emp2_org2)

        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def test_get_account_status_unlinked_employee(self):
        status_resp = get_employee_account_status(
            employee_id=self.emp1.id,
            current_user=self.admin_user,
            db=self.db,
        )
        self.assertFalse(status_resp.has_account)
        self.assertIsNone(status_resp.user_id)
        self.assertEqual(status_resp.email, "jane.doe@org1.com")
        self.assertIsNone(status_resp.role_name)

    def test_get_account_status_cross_tenant_rejected(self):
        with self.assertRaises(HTTPException) as ctx:
            get_employee_account_status(
                employee_id=self.emp2_org2.id,
                current_user=self.admin_user,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 404)

    def test_create_account_success(self):
        payload = EmployeeAccountCreate(
            password="EmployeePassword123!",
            email=None,
        )
        result = create_employee_account(
            employee_id=self.emp1.id,
            payload=payload,
            current_user=self.admin_user,
            db=self.db,
        )
        self.assertTrue(result.has_account)
        self.assertIsNotNone(result.user_id)
        self.assertEqual(result.email, "jane.doe@org1.com")
        self.assertEqual(result.role_name, "EMPLOYEE")
        self.assertTrue(result.is_active)
        self.assertTrue(result.is_verified)

        # Verify DB state
        db_user = self.db.execute(select(User).where(User.id == result.user_id)).scalar_one()
        self.assertEqual(db_user.email, "jane.doe@org1.com")
        self.assertEqual(db_user.organization_id, self.org1.id)
        self.assertEqual(db_user.role_id, self.roles["EMPLOYEE"].id)
        self.assertTrue(verify_password("EmployeePassword123!", db_user.password_hash))

        # Verify employee linkage
        db_emp = self.db.execute(select(Employee).where(Employee.id == self.emp1.id)).scalar_one()
        self.assertEqual(db_emp.user_id, result.user_id)

    def test_create_account_with_explicit_email(self):
        payload = EmployeeAccountCreate(
            password="EmployeePassword123!",
            email="jane.custom@org1.com",
        )
        result = create_employee_account(
            employee_id=self.emp1.id,
            payload=payload,
            current_user=self.hr_user,
            db=self.db,
        )
        self.assertTrue(result.has_account)
        self.assertEqual(result.email, "jane.custom@org1.com")

        # Verify employee email was updated
        db_emp = self.db.execute(select(Employee).where(Employee.id == self.emp1.id)).scalar_one()
        self.assertEqual(db_emp.email, "jane.custom@org1.com")

    def test_create_account_fails_if_already_linked(self):
        # First creation succeeds
        create_employee_account(
            employee_id=self.emp1.id,
            payload=EmployeeAccountCreate(password="EmployeePassword123!"),
            current_user=self.admin_user,
            db=self.db,
        )
        # Second creation must fail
        with self.assertRaises(HTTPException) as ctx:
            create_employee_account(
                employee_id=self.emp1.id,
                payload=EmployeeAccountCreate(password="AnotherPassword123!"),
                current_user=self.admin_user,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("already has a linked user account", ctx.exception.detail)

    def test_create_account_fails_if_no_email_provided_and_none_on_employee(self):
        emp_no_email = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            employee_code="EMP-NO-MAIL",
            first_name="No",
            last_name="Mail",
            email=None,
            employment_status="ACTIVE",
        )
        self.db.add(emp_no_email)
        self.db.commit()

        with self.assertRaises(HTTPException) as ctx:
            create_employee_account(
                employee_id=emp_no_email.id,
                payload=EmployeeAccountCreate(password="EmployeePassword123!"),
                current_user=self.admin_user,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("email address is required", ctx.exception.detail)

    def test_reset_password_success(self):
        # First provision account
        account_resp = create_employee_account(
            employee_id=self.emp1.id,
            payload=EmployeeAccountCreate(password="InitialPassword123!"),
            current_user=self.admin_user,
            db=self.db,
        )

        # Now reset password
        reset_resp = reset_employee_password(
            employee_id=self.emp1.id,
            payload=EmployeePasswordReset(password="NewResetPassword456!"),
            current_user=self.admin_user,
            db=self.db,
        )
        self.assertEqual(reset_resp["message"], "Password reset successfully")

        # Verify new password works and old one fails
        db_user = self.db.execute(select(User).where(User.id == account_resp.user_id)).scalar_one()
        self.assertTrue(verify_password("NewResetPassword456!", db_user.password_hash))
        self.assertFalse(verify_password("InitialPassword123!", db_user.password_hash))

    def test_reset_password_fails_for_unlinked_employee(self):
        with self.assertRaises(HTTPException) as ctx:
            reset_employee_password(
                employee_id=self.emp1.id,
                payload=EmployeePasswordReset(password="NewResetPassword456!"),
                current_user=self.admin_user,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("does not have a linked user account", ctx.exception.detail)

    def test_regular_employee_cannot_view_another_employees_account(self):
        # Create user for emp1
        create_employee_account(
            employee_id=self.emp1.id,
            payload=EmployeeAccountCreate(password="InitialPassword123!"),
            current_user=self.admin_user,
            db=self.db,
        )
        regular_user = self.db.execute(select(User).where(User.email == "jane.doe@org1.com")).scalar_one()

        # Create another employee in org1
        other_emp = Employee(
            id=uuid4(),
            organization_id=self.org1.id,
            employee_code="EMP-OTHER",
            first_name="Other",
            last_name="Person",
            email="other@org1.com",
            employment_status="ACTIVE",
        )
        self.db.add(other_emp)
        self.db.commit()

        # regular_user querying other_emp must receive 403 Forbidden
        with self.assertRaises(HTTPException) as ctx:
            get_employee_account_status(
                employee_id=other_emp.id,
                current_user=regular_user,
                db=self.db,
            )
        self.assertEqual(ctx.exception.status_code, 403)

        # regular_user querying their OWN employee record must succeed (200)
        own_status = get_employee_account_status(
            employee_id=self.emp1.id,
            current_user=regular_user,
            db=self.db,
        )
        self.assertTrue(own_status.has_account)
        self.assertEqual(own_status.user_id, regular_user.id)


if __name__ == "__main__":
    unittest.main()
