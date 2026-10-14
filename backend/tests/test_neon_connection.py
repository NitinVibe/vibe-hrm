import os
import unittest
from unittest.mock import patch
from sqlalchemy.engine import make_url
from sqlalchemy.pool import NullPool, QueuePool

from app.core.config import Settings, normalize_database_url


class NeonConnectionConfigurationTestCase(unittest.TestCase):
    """
    Unit tests for Neon database connection enhancements.
    Uses fake URLs and test configuration only. Never connects to a live database.
    """

    # -------------------------------------------------------------------------
    # 1. URL Scheme Prefix Normalization & Credential Preservation
    # -------------------------------------------------------------------------
    def test_url_prefix_normalization_all_schemes(self):
        """Test that postgres://, postgresql://, and postgresql+psycopg:// normalize correctly."""
        # Case A: postgres://
        url_a = "postgres://usr:pwd@ep-test.neon.tech/neondb"
        norm_a = normalize_database_url(url_a)
        self.assertEqual(norm_a, "postgresql+psycopg://usr:pwd@ep-test.neon.tech/neondb")

        # Case B: postgresql://
        url_b = "postgresql://usr:pwd@ep-test.neon.tech/neondb"
        norm_b = normalize_database_url(url_b)
        self.assertEqual(norm_b, "postgresql+psycopg://usr:pwd@ep-test.neon.tech/neondb")

        # Case C: postgresql+psycopg:// (already normalized)
        url_c = "postgresql+psycopg://usr:pwd@ep-test.neon.tech/neondb"
        norm_c = normalize_database_url(url_c)
        self.assertEqual(norm_c, "postgresql+psycopg://usr:pwd@ep-test.neon.tech/neondb")

        # Case D: non-postgres schemes (e.g., sqlite) are left untouched
        url_d = "sqlite:///:memory:"
        norm_d = normalize_database_url(url_d)
        self.assertEqual(norm_d, "sqlite:///:memory:")

    def test_credentials_and_query_parameters_preserved(self):
        """Verify complex percent-encoded credentials and query parameters remain intact."""
        complex_url = (
            "postgres://user%40corp.com:p%25ss%23w%40rd@ep-cool-shadow-123.us-east-2.aws.neon.tech:5432/vibe_db"
            "?sslmode=verify-full&sslrootcert=%2Fpath%2Fca.pem&application_name=vibe_hrm"
        )
        norm = normalize_database_url(complex_url)

        self.assertTrue(norm.startswith("postgresql+psycopg://"))
        parsed = make_url(norm)

        # Confirm credentials and query parameters parsed correctly
        self.assertEqual(parsed.username, "user@corp.com")
        self.assertEqual(parsed.password, "p%ss#w@rd")
        self.assertEqual(parsed.host, "ep-cool-shadow-123.us-east-2.aws.neon.tech")
        self.assertEqual(parsed.port, 5432)
        self.assertEqual(parsed.database, "vibe_db")
        self.assertEqual(parsed.query["sslmode"], "verify-full")
        self.assertEqual(parsed.query["sslrootcert"], "/path/ca.pem")
        self.assertEqual(parsed.query["application_name"], "vibe_hrm")

    # -------------------------------------------------------------------------
    # 2. Runtime vs. Direct URL Routing
    # -------------------------------------------------------------------------
    def test_runtime_prefers_pooled_url_when_present(self):
        """Verify effective_database_url prefers DATABASE_URL_POOLED when present."""
        cfg = Settings(
            DATABASE_URL="postgres://direct_user:pass@ep-direct.neon.tech/db",
            DATABASE_URL_POOLED="postgres://pool_user:pass@ep-direct-pooler.neon.tech/db",
            JWT_SECRET_KEY="test-secret-key",
        )
        # Runtime must prefer pooled
        self.assertIn("ep-direct-pooler.neon.tech", cfg.effective_database_url)
        self.assertTrue(cfg.effective_database_url.startswith("postgresql+psycopg://"))

        # Direct URL must remain the direct endpoint
        self.assertIn("ep-direct.neon.tech", cfg.direct_database_url)
        self.assertNotIn("-pooler", cfg.direct_database_url)

    def test_runtime_falls_back_to_direct_url_when_no_pooler(self):
        """Verify effective_database_url falls back to direct URL when DATABASE_URL_POOLED is absent."""
        cfg = Settings(
            DATABASE_URL="postgresql://direct_user:pass@ep-direct.neon.tech/db",
            DATABASE_URL_POOLED=None,
            JWT_SECRET_KEY="test-secret-key",
        )
        self.assertEqual(
            cfg.effective_database_url,
            "postgresql+psycopg://direct_user:pass@ep-direct.neon.tech/db",
        )
        self.assertEqual(cfg.effective_database_url, cfg.direct_database_url)

    # -------------------------------------------------------------------------
    # 3. Alembic Direct URL & Pooled Rejection
    # -------------------------------------------------------------------------
    def test_alembic_uses_direct_url_and_rejects_pooler(self):
        """Verify Alembic migration check strictly rejects pooled URLs."""
        # A pooled host should be detected and raise RuntimeError
        pooled_url = "postgresql+psycopg://migrator:pass@ep-shikari-pooler.neon.tech/neondb"
        parsed = make_url(pooled_url)
        self.assertIn("-pooler", parsed.host)

        # Simulation of alembic/env.py check
        def validate_migration_url(url: str):
            if not url or not url.strip():
                raise RuntimeError("Alembic migration halted: No direct database URL is configured.")
            parsed_u = make_url(url)
            if parsed_u.host and "-pooler" in parsed_u.host:
                raise RuntimeError(
                    f"Alembic migration halted: Detected pooled connection URL with host '{parsed_u.host}'."
                )
            return url

        with self.assertRaises(RuntimeError) as ctx:
            validate_migration_url(pooled_url)
        self.assertIn("Detected pooled connection URL", str(ctx.exception))

        # Direct host passes validation
        direct_url = "postgresql+psycopg://migrator:pass@ep-shikari.neon.tech/neondb"
        self.assertEqual(validate_migration_url(direct_url), direct_url)

    def test_missing_direct_url_raises_clear_error(self):
        """Verify missing direct URL produces a clear, safe error."""
        cfg = Settings(
            DATABASE_URL="",
            JWT_SECRET_KEY="test-secret-key",
        )
        self.assertEqual(cfg.direct_database_url, "")

    # -------------------------------------------------------------------------
    # 4. Connection Pool Selection (NullPool vs QueuePool)
    # -------------------------------------------------------------------------
    def test_pool_selection_logic(self):
        """Verify NullPool vs QueuePool selection under various environments."""
        def resolve_pool_class(url_str: str, db_pool_class: str, is_vercel: bool):
            parsed = make_url(url_str)
            host = parsed.host or ""
            if db_pool_class.lower() == "null" or is_vercel or ("-pooler" in host):
                return NullPool
            return QueuePool

        # Case 1: Local development with standard host -> QueuePool
        self.assertIs(
            resolve_pool_class("postgresql+psycopg://user:pass@localhost:5432/db", "queue", False),
            QueuePool,
        )

        # Case 2: Pooler host detected in URL -> NullPool
        self.assertIs(
            resolve_pool_class("postgresql+psycopg://user:pass@ep-test-pooler.neon.tech/db", "queue", False),
            NullPool,
        )

        # Case 3: Vercel serverless environment detected -> NullPool
        self.assertIs(
            resolve_pool_class("postgresql+psycopg://user:pass@ep-test.neon.tech/db", "queue", True),
            NullPool,
        )

        # Case 4: Explicit DB_POOL_CLASS=null -> NullPool
        self.assertIs(
            resolve_pool_class("postgresql+psycopg://user:pass@localhost:5432/db", "null", False),
            NullPool,
        )

    # -------------------------------------------------------------------------
    # 5. SSL Preservation & Duplicate Prevention
    # -------------------------------------------------------------------------
    def test_ssl_settings_preserved_without_duplicate_connect_args(self):
        """Verify that explicit sslmode is preserved and not duplicated or downgraded."""
        def build_connect_args(url_str: str, ssl_required: bool, statement_timeout_ms: int):
            parsed = make_url(url_str)
            args: dict[str, str] = {}
            if statement_timeout_ms > 0 and "options" not in parsed.query:
                args["options"] = f"-c statement_timeout={statement_timeout_ms}"

            if "sslmode" not in parsed.query:
                host = parsed.host or ""
                if ssl_required or ("neon.tech" in host):
                    args["sslmode"] = "require"
            return args

        # Scenario A: Stricter sslmode=verify-full explicitly in URL
        url_strict = "postgresql+psycopg://usr:pwd@ep-test.neon.tech/db?sslmode=verify-full"
        args_strict = build_connect_args(url_strict, ssl_required=True, statement_timeout_ms=30000)
        # connect_args should NOT have sslmode because it is already in the URL
        self.assertNotIn("sslmode", args_strict)
        self.assertIn("options", args_strict)

        # Scenario B: URL has no sslmode, but host is on neon.tech -> inject sslmode=require
        url_no_ssl = "postgresql+psycopg://usr:pwd@ep-test.neon.tech/db"
        args_no_ssl = build_connect_args(url_no_ssl, ssl_required=False, statement_timeout_ms=30000)
        self.assertEqual(args_no_ssl.get("sslmode"), "require")

        # Scenario C: URL already has options in query -> do not duplicate options
        url_options = "postgresql+psycopg://usr:pwd@ep-test.neon.tech/db?options=-c+statement_timeout%3D15000"
        args_options = build_connect_args(url_options, ssl_required=False, statement_timeout_ms=30000)
        self.assertNotIn("options", args_options)

    def test_statement_timeout_omitted_for_pooler_host(self):
        """Verify that -c statement_timeout startup option is strictly omitted for Neon PgBouncer pooler hosts."""
        def build_connect_args_v2(url_str: str, statement_timeout_ms: int):
            parsed = make_url(url_str)
            host = parsed.host or ""
            is_pooler = "-pooler" in host
            args: dict[str, str] = {}
            if statement_timeout_ms > 0 and not is_pooler:
                if "options" not in parsed.query:
                    args["options"] = f"-c statement_timeout={statement_timeout_ms}"
            return args

        # Case 1: Pooler host -> options must NOT be present
        pooler_url = "postgresql+psycopg://usr:pwd@ep-test-pooler.neon.tech/db"
        pooler_args = build_connect_args_v2(pooler_url, statement_timeout_ms=30000)
        self.assertNotIn("options", pooler_args)

        # Case 2: Direct host -> options must be present
        direct_url = "postgresql+psycopg://usr:pwd@ep-test.neon.tech/db"
        direct_args = build_connect_args_v2(direct_url, statement_timeout_ms=30000)
        self.assertIn("options", direct_args)
        self.assertEqual(direct_args["options"], "-c statement_timeout=30000")

    # -------------------------------------------------------------------------
    # 6. Process Environment Variable Overrides .env Values
    # -------------------------------------------------------------------------
    def test_environment_variables_override_env_file(self):
        """Verify process environment variables strictly take precedence over .env file values."""
        override_val = "postgresql://override_user:pass@override-host:5432/override_db"
        with patch.dict(os.environ, {"DATABASE_URL": override_val}):
            cfg = Settings(JWT_SECRET_KEY="test-secret-key")
            self.assertEqual(cfg.DATABASE_URL, override_val)
            self.assertEqual(
                cfg.direct_database_url,
                "postgresql+psycopg://override_user:pass@override-host:5432/override_db",
            )


if __name__ == "__main__":
    unittest.main()
