from datetime import datetime, timedelta, timezone
import unittest
from uuid import uuid4

from jose import jwt

from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from app.main import app
from app.schemas.auth import LoginRequest, TokenResponse, UserMeResponse


class AuthenticationSecurityTestCase(unittest.TestCase):
    def test_password_hashing_and_verification(self):
        password = "SecurePassword123!"
        hashed = get_password_hash(password)
        self.assertTrue(hashed.startswith("$2b$"))
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

    def test_jwt_token_creation_and_decoding(self):
        user_id = uuid4()
        token = create_access_token(subject=user_id)
        payload = decode_access_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload.get("sub"), str(user_id))

    def test_jwt_token_expiration(self):
        user_id = uuid4()
        expired_payload = {
            "sub": str(user_id),
            "exp": datetime.now(timezone.utc) - timedelta(minutes=10),
        }
        expired_token = jwt.encode(
            expired_payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
        )
        payload = decode_access_token(expired_token)
        self.assertIsNone(payload)

    def test_jwt_invalid_signature(self):
        user_id = uuid4()
        fake_token = jwt.encode(
            {"sub": str(user_id)},
            "completely-wrong-secret-key-1234567890",
            algorithm=settings.JWT_ALGORITHM,
        )
        payload = decode_access_token(fake_token)
        self.assertIsNone(payload)

    def test_auth_routes_registered_in_app(self):
        route_paths = list(app.openapi()["paths"].keys())
        self.assertIn("/api/v1/auth/login", route_paths)
        self.assertIn("/api/v1/auth/me", route_paths)
        self.assertIn("/health", route_paths)
        self.assertIn("/health/db", route_paths)

    def test_schemas_do_not_expose_password_hash(self):
        token_fields = list(TokenResponse.model_fields.keys())
        me_fields = list(UserMeResponse.model_fields.keys())
        self.assertNotIn("password_hash", token_fields)
        self.assertNotIn("password_hash", me_fields)


if __name__ == "__main__":
    unittest.main()
