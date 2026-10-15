from pathlib import Path
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# Locate backend directory and project root directory safely
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_ROOT_DIR = _BACKEND_DIR.parent
_ENV_FILES = (
    str(_ROOT_DIR / ".env"),
    str(_BACKEND_DIR / ".env"),
    ".env",
    "backend/.env",
)


def normalize_database_url(url: str | None) -> str:
    """
    Normalize PostgreSQL URL scheme prefixes to 'postgresql+psycopg://'.
    Preserves percent-encoded credentials, hostname, port, database, and query parameters intact.
    Leaves non-PostgreSQL URLs (such as sqlite://) and already normalized URLs untouched.
    """
    if not url:
        return ""
    trimmed = url.strip()
    if trimmed.startswith("postgres://"):
        return "postgresql+psycopg://" + trimmed[len("postgres://"):]
    elif trimmed.startswith("postgresql://") and not trimmed.startswith("postgresql+"):
        return "postgresql+psycopg://" + trimmed[len("postgresql://"):]
    return trimmed


class Settings(BaseSettings):
    APP_NAME: str = "Vibe HRM"
    APP_ENV: str = "development"
    DEBUG: bool = False
    ENABLE_DOCS: bool = False

    # Database Configuration (PostgreSQL / Neon)
    DATABASE_URL: str = ""
    DATABASE_URL_POOLED: str | None = None
    DB_POOL_CLASS: str = "queue"  # "queue" for persistent servers, "null" for serverless (Vercel/Neon)
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_RECYCLE_SECONDS: int = 1800
    DB_POOL_TIMEOUT_SECONDS: int = 30
    DB_STATEMENT_TIMEOUT_MS: int = 30000
    DB_SSL_REQUIRED: bool = False

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS: str = "http://localhost:5173"
    CORS_ORIGIN_REGEX: str | None = r"^https:\/\/.*\.vercel\.app$"

    # Login rate limiting configuration
    RATE_LIMIT_LOGIN_MAX_ATTEMPTS: int = 5
    RATE_LIMIT_LOGIN_WINDOW_SECONDS: int = 60
    UPSTASH_REDIS_REST_URL: str | None = None
    UPSTASH_REDIS_REST_TOKEN: str | None = None
    REDIS_URL: str | None = None

    @property
    def effective_database_url(self) -> str:
        """
        Database URL for runtime queries.
        Prefers DATABASE_URL_POOLED when explicitly configured (for serverless PgBouncer pooler),
        otherwise falls back to DATABASE_URL. Scheme is normalized to postgresql+psycopg://.
        """
        if self.DATABASE_URL_POOLED and self.DATABASE_URL_POOLED.strip():
            return normalize_database_url(self.DATABASE_URL_POOLED)
        return normalize_database_url(self.DATABASE_URL)

    @property
    def direct_database_url(self) -> str:
        """
        Direct database URL for Alembic migrations and administrative operations.
        Bypasses poolers and connects directly to PostgreSQL.
        """
        return normalize_database_url(self.DATABASE_URL)

    @model_validator(mode="after")
    def enforce_production_safety(self) -> "Settings":
        """Ensure production environment strictly enforces safety flags."""
        if self.APP_ENV.lower() in ("production", "prod"):
            self.DEBUG = False
        return self

    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
