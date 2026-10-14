"""add_departments_and_designations

Revision ID: 0650ac39674b
Revises: 8bd448448e44
Create Date: 2026-10-13 15:08:51.963774

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0650ac39674b"
down_revision: Union[str, Sequence[str], None] = "8bd448448e44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. departments
    op.create_table(
        "departments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_departments_organization_id",
        ),
        sa.PrimaryKeyConstraint("id", name="departments_pkey"),
        sa.UniqueConstraint("organization_id", "id", name="uq_departments_org_id"),
    )
    op.create_index(
        "ix_departments_organization_id",
        "departments",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        "uq_departments_org_name_ci",
        "departments",
        ["organization_id", sa.text("lower(name)")],
        unique=True,
    )

    # 2. designations
    op.create_table(
        "designations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("department_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_designations_organization_id",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "department_id"],
            ["departments.organization_id", "departments.id"],
            name="fk_designations_department_org",
        ),
        sa.PrimaryKeyConstraint("id", name="designations_pkey"),
    )
    op.create_index(
        "ix_designations_organization_id",
        "designations",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        "ix_designations_department_id",
        "designations",
        ["department_id"],
        unique=False,
    )
    op.create_index(
        "uq_designations_org_name_ci",
        "designations",
        ["organization_id", sa.text("lower(name)")],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_designations_org_name_ci", table_name="designations")
    op.drop_index("ix_designations_department_id", table_name="designations")
    op.drop_index("ix_designations_organization_id", table_name="designations")
    op.drop_table("designations")

    op.drop_index("uq_departments_org_name_ci", table_name="departments")
    op.drop_index("ix_departments_organization_id", table_name="departments")
    op.drop_table("departments")
