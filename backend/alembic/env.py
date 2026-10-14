from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from sqlalchemy.engine import make_url

from alembic import context

from app.core.config import settings
from app.db.base import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# Validate and configure direct database connection for migrations
migration_url = settings.direct_database_url
if not migration_url or not migration_url.strip():
    raise RuntimeError(
        "Alembic migration halted: No direct database URL is configured. "
        "Set DATABASE_URL in the environment or configuration."
    )

parsed_migration_url = make_url(migration_url)
if parsed_migration_url.host and "-pooler" in parsed_migration_url.host:
    raise RuntimeError(
        f"Alembic migration halted: Detected pooled connection URL with host '{parsed_migration_url.host}'. "
        "Alembic migrations must use a direct PostgreSQL connection (without '-pooler') "
        "because PgBouncer in transaction pooling mode breaks transactional DDL and advisory locks."
    )

config.set_main_option(
    "sqlalchemy.url",
    migration_url.replace("%", "%%"),
)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    section = config.get_section(config.config_ini_section, {})
    section["sqlalchemy.url"] = migration_url

    connectable = engine_from_config(
        section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
