import os
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool, QueuePool

from app.core.config import settings


raw_url = settings.effective_database_url
if not raw_url:
    raise RuntimeError(
        "Database session configuration error: No database URL configured. "
        "Set DATABASE_URL or DATABASE_URL_POOLED in environment."
    )

parsed_url = make_url(raw_url)
host_str = parsed_url.host or ""
is_pooler_host = "-pooler" in host_str
connect_args: dict[str, str] = {}

# 1. Apply statement timeout safely if configured, not in URL query, and NOT connecting through a pooler
# Neon's PgBouncer pooler operates in transaction pooling mode and rejects -c statement_timeout in startup options
if settings.DB_STATEMENT_TIMEOUT_MS > 0 and not is_pooler_host:
    if "options" not in parsed_url.query:
        connect_args["options"] = f"-c statement_timeout={settings.DB_STATEMENT_TIMEOUT_MS}"

# 2. SSL handling:
# If sslmode is already specified in URL query (e.g. verify-full, require, disable),
# preserve it as-is and do not inject a duplicate or downgraded parameter into connect_args
if "sslmode" not in parsed_url.query:
    if settings.DB_SSL_REQUIRED or ("neon.tech" in host_str):
        connect_args["sslmode"] = "require"

# 3. Connection pooling strategy:
# Select NullPool when DB_POOL_CLASS is 'null', VERCEL environment is detected,
# or the parsed hostname points to a PgBouncer pooler (e.g. '-pooler' in host)
is_serverless_env = bool(os.environ.get("VERCEL"))
is_explicit_null_pool = settings.DB_POOL_CLASS.lower() == "null"

if is_explicit_null_pool or is_serverless_env or is_pooler_host:
    engine = create_engine(
        raw_url,
        poolclass=NullPool,
        connect_args=connect_args,
    )
else:
    engine = create_engine(
        raw_url,
        poolclass=QueuePool,
        pool_pre_ping=True,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_recycle=settings.DB_POOL_RECYCLE_SECONDS,
        pool_timeout=settings.DB_POOL_TIMEOUT_SECONDS,
        connect_args=connect_args,
    )

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
