import asyncio
import unittest
from datetime import date
from decimal import Decimal
from uuid import uuid4

from fastapi import HTTPException, Response

from app.api.v1.auth import login
from app.api.v1.employees import create_employee, list_employees
from app.api.v1.payroll import (
    approve_payroll_run,
    create_payroll_run,
    mark_payroll_run_paid,
    process_payroll_run,
    set_employee_salary,
)
from app.core.config import Settings
from app.core.rate_limit import enforce_login_rate_limit, get_rate_limit_store
from app.db.session import SessionLocal
from app.main import add_security_headers
from app.models.employee import Employee
from app.models.organization import Organization
from app.models.payroll import EmployeeSalary, PayrollRun, Payslip
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import LoginRequest
from app.schemas.employee import EmployeeCreate
from app.schemas.payroll import EmployeeSalaryCreateOrUpdate, PayrollRunCreate


class MockClient:
    def __init__(self, host: str = "192.168.1.50"):
        self.host = host


class MockRequest:
    def __init__(
        self,
        client_ip: str = "192.168.1.50",
        headers: dict[str, str] | None = None,
        scheme: str = "http",
    ):
        self.client = MockClient(client_ip)
        self.headers = headers or {}
        self.url = type("URL", (), {"scheme": scheme})


class StageB2SecurityRemediationTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()

        # 1. Ensure ORG_ADMIN and HR roles exist
        cls.org_admin_role = cls.db.query(Role).filter(Role.name == "ORG_ADMIN").first()
        if not cls.org_admin_role:
            cls.org_admin_role = Role(id=uuid4(), name="ORG_ADMIN", description="Org Admin")
            cls.db.add(cls.org_admin_role)
            cls.db.commit()

        # 2. Setup isolated test organization
        cls.test_org = Organization(
            id=uuid4(),
            name=f"SecTest Org {uuid4().hex[:6]}",
            slug=f"sectest-org-{uuid4().hex[:6]}",
            is_active=True,
        )
        cls.db.add(cls.test_org)
        cls.db.commit()

        # 3. Create test admin user
        cls.admin_user = User(
            id=uuid4(),
            organization_id=cls.test_org.id,
            role_id=cls.org_admin_role.id,
            email=f"admin.{uuid4().hex[:6]}@example.com",
            password_hash="$2b$12$K1kJGv.D34K6Jz359H2ZfeqQoQO9QoQO9QoQO9QoQO9QoQO9QoQO9",  # dummy
            is_active=True,
            is_verified=True,
        )
        cls.db.add(cls.admin_user)
        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        # Clean up test organization data in reverse dependency order
        cls.db.query(Payslip).filter(Payslip.organization_id == cls.test_org.id).delete()
        cls.db.query(PayrollRun).filter(PayrollRun.organization_id == cls.test_org.id).delete()
        cls.db.query(EmployeeSalary).filter(EmployeeSalary.organization_id == cls.test_org.id).delete()
        cls.db.query(Employee).filter(Employee.organization_id == cls.test_org.id).delete()
        cls.db.query(User).filter(User.organization_id == cls.test_org.id).delete()
        cls.db.query(Organization).filter(Organization.id == cls.test_org.id).delete()
        cls.db.commit()
        cls.db.close()

    def setUp(self):
        # Reset in-memory rate limiting counters before each test
        get_rate_limit_store().reset()

    # -------------------------------------------------------------
    # 1. Security Headers Middleware Verification
    # -------------------------------------------------------------
    def test_security_headers_middleware_injection(self):
        """Verify standard defensive HTTP security headers are injected by middleware."""
        mock_req = MockRequest(scheme="http")

        async def dummy_call_next(req):
            return Response("OK", status_code=200)

        response = asyncio.run(add_security_headers(mock_req, dummy_call_next))

        self.assertEqual(response.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(response.headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(response.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin")
        self.assertIn("default-src 'self'", response.headers.get("Content-Security-Policy", ""))
        self.assertIn("frame-ancestors 'none'", response.headers.get("Content-Security-Policy", ""))

    def test_hsts_header_injected_on_https(self):
        """Verify HSTS header is strictly injected for HTTPS requests."""
        https_req = MockRequest(scheme="https", headers={"x-forwarded-proto": "https"})

        async def dummy_call_next(req):
            return Response("OK", status_code=200)

        response = asyncio.run(add_security_headers(https_req, dummy_call_next))
        self.assertIn("Strict-Transport-Security", response.headers)
        self.assertIn("max-age=31536000", response.headers["Strict-Transport-Security"])

    # -------------------------------------------------------------
    # 2. Production Configuration Safety
    # -------------------------------------------------------------
    def test_production_env_forces_debug_false(self):
        """Verify production environment setting strictly forces DEBUG to False."""
        cfg = Settings(
            APP_ENV="production",
            DEBUG=True,  # Attempting to override DEBUG=True in prod
            DATABASE_URL="postgresql+psycopg://test:test@localhost:5432/test",
            JWT_SECRET_KEY="test-secret-key",
        )
        self.assertFalse(cfg.DEBUG, "DEBUG must be forced to False in production environment")

    # -------------------------------------------------------------
    # 3. Login Abuse & Rate Limiting Enforcement
    # -------------------------------------------------------------
    def test_login_rate_limiting_triggers_429(self):
        """Verify exceeding max failed login attempts returns HTTP 429 Too Many Requests."""
        test_email = f"target.{uuid4().hex[:6]}@example.com"
        payload = LoginRequest(email=test_email, password="WrongPassword123!")
        mock_req = MockRequest(client_ip="203.0.113.19")

        # Attempts 1 to 5 should fail with HTTP 401 Unauthorized
        for i in range(5):
            with self.assertRaises(HTTPException) as ctx:
                login(payload=payload, request=mock_req, db=self.db)
            self.assertEqual(
                ctx.exception.status_code,
                401,
                f"Attempt {i + 1} should be 401 Unauthorized, got {ctx.exception.status_code}",
            )

        # Attempt 6 must be blocked by rate limiter with HTTP 429
        with self.assertRaises(HTTPException) as ctx:
            login(payload=payload, request=mock_req, db=self.db)

        self.assertEqual(ctx.exception.status_code, 429)
        self.assertIn("Retry-After", ctx.exception.headers)
        self.assertIn("Too many", ctx.exception.detail)

    # -------------------------------------------------------------
    # 4. Strict Payroll Approval State Transition Enforcement
    # -------------------------------------------------------------
    def test_payroll_run_payment_requires_approval(self):
        """Verify a PROCESSED payroll run cannot bypass the REQUIRED approval step."""
        # Create test employee
        code = f"SEC{uuid4().hex[:4].upper()}"
        emp = create_employee(
            payload=EmployeeCreate(
                employee_code=code,
                first_name="Sec",
                last_name="Test",
                employment_status="ACTIVE",
            ),
            current_user=self.admin_user,
            db=self.db,
        )

        # Configure salary
        set_employee_salary(
            payload=EmployeeSalaryCreateOrUpdate(
                employee_id=emp.id,
                basic_salary=Decimal("50000.00"),
                allowances=Decimal("5000.00"),
                deductions=Decimal("2000.00"),
                payment_method="BANK_TRANSFER",
                is_active=True,
            ),
            current_user=self.admin_user,
            db=self.db,
        )

        # Create & process run for a valid period key format (YYYY-MM)
        period_key = f"2026-11"
        run = create_payroll_run(
            payload=PayrollRunCreate(
                period_key=period_key,
                start_date=date(2026, 11, 1),
                end_date=date(2026, 11, 30),
            ),
            current_user=self.admin_user,
            db=self.db,
        )
        processed = process_payroll_run(run.id, current_user=self.admin_user, db=self.db)
        self.assertEqual(processed.status, "PROCESSED")

        # ATTEMPT TO PAY DIRECTLY WITHOUT APPROVAL -> MUST BE REJECTED (HTTP 400)
        with self.assertRaises(HTTPException) as ctx:
            mark_payroll_run_paid(run.id, current_user=self.admin_user, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("APPROVED", ctx.exception.detail)

        # Now approve run -> status becomes APPROVED
        approved = approve_payroll_run(run.id, current_user=self.admin_user, db=self.db)
        self.assertEqual(approved.status, "APPROVED")

        # Now mark paid -> succeeds
        paid = mark_payroll_run_paid(run.id, current_user=self.admin_user, db=self.db)
        self.assertEqual(paid.status, "PAID")

    # -------------------------------------------------------------
    # 5. Bounded Pagination Enforcement
    # -------------------------------------------------------------
    def test_employee_pagination_offset_and_limit(self):
        """Verify pagination offset and limit correctly bound employee queries."""
        # Create 3 employees
        for i in range(3):
            create_employee(
                payload=EmployeeCreate(
                    employee_code=f"PAG{i}_{uuid4().hex[:4].upper()}",
                    first_name=f"Page{i}",
                    last_name="Test",
                    employment_status="ACTIVE",
                ),
                current_user=self.admin_user,
                db=self.db,
            )

        # Fetch with limit=1, offset=0
        page1 = list_employees(
            limit=1,
            offset=0,
            current_user=self.admin_user,
            db=self.db,
        )
        self.assertEqual(len(page1), 1)

        # Fetch with limit=1, offset=1
        page2 = list_employees(
            limit=1,
            offset=1,
            current_user=self.admin_user,
            db=self.db,
        )
        self.assertEqual(len(page2), 1)
        self.assertNotEqual(page1[0].id, page2[0].id)


if __name__ == "__main__":
    unittest.main()
