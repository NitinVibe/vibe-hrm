"""baseline schema

Revision ID: 8bd448448e44
Revises:
Create Date: 2026-10-12 09:50:00.000000

"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8bd448448e44"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. organizations
    op.create_table(
        "organizations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("slug", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="organizations_pkey"),
    )
    op.create_index("ix_organizations_slug", "organizations", ["slug"], unique=True)

    # 2. roles
    roles_table = op.create_table(
        "roles",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("id", name="roles_pkey"),
        sa.UniqueConstraint("name", name="roles_name_key"),
    )

    # Seed the 5 system roles
    op.bulk_insert(
        roles_table,
        [
            {
                "id": uuid.UUID("9ee891f5-704a-47bf-8888-d0af2fe7e8f9"),
                "name": "SUPER_ADMIN",
                "description": "System-wide administrator",
            },
            {
                "id": uuid.UUID("77fc725d-f734-4fdc-a7d7-2a68a80155bf"),
                "name": "ORG_ADMIN",
                "description": "Organization administrator",
            },
            {
                "id": uuid.UUID("0d5a5a00-e395-4f77-8330-e05c970965fa"),
                "name": "HR",
                "description": "Human resources administrator",
            },
            {
                "id": uuid.UUID("c02a7b4a-9d7f-4fb0-a4d6-6e3d4c0b1547"),
                "name": "MANAGER",
                "description": "Department or team manager",
            },
            {
                "id": uuid.UUID("aca546d9-33eb-4481-89bc-3a3b8e193d5f"),
                "name": "EMPLOYEE",
                "description": "Regular employee",
            },
        ],
    )

    # 3. users
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("role_id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False),
        sa.Column("last_login_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], name="users_organization_id_fkey"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], name="users_role_id_fkey"),
        sa.PrimaryKeyConstraint("id", name="users_pkey"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_organization_id", "users", ["organization_id"], unique=False)

    # 4. employees
    op.create_table(
        "employees",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("employee_code", sa.String(length=50), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("joining_date", sa.Date(), nullable=True),
        sa.Column("employment_status", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], name="employees_organization_id_fkey"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="employees_user_id_fkey"),
        sa.PrimaryKeyConstraint("id", name="employees_pkey"),
        sa.UniqueConstraint("user_id", name="employees_user_id_key"),
    )
    op.create_index("ix_employees_employee_code", "employees", ["employee_code"], unique=False)
    op.create_index("ix_employees_organization_id", "employees", ["organization_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_employees_organization_id", table_name="employees")
    op.drop_index("ix_employees_employee_code", table_name="employees")
    op.drop_table("employees")

    op.drop_index("ix_users_organization_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.drop_table("roles")

    op.drop_index("ix_organizations_slug", table_name="organizations")
    op.drop_table("organizations")
