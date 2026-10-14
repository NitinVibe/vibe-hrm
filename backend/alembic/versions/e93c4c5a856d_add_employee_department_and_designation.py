"""add_employee_department_and_designation

Revision ID: e93c4c5a856d
Revises: 0650ac39674b
Create Date: 2026-10-13 16:00:37.894625

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e93c4c5a856d"
down_revision: Union[str, Sequence[str], None] = "0650ac39674b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add unique constraints to designations to allow composite foreign key references
    op.create_unique_constraint(
        "uq_designations_org_id",
        "designations",
        ["organization_id", "id"],
    )
    op.create_unique_constraint(
        "uq_designations_org_dept_id",
        "designations",
        ["organization_id", "department_id", "id"],
    )

    # 2. Add nullable department_id and designation_id columns to employees
    op.add_column(
        "employees",
        sa.Column("department_id", sa.UUID(), nullable=True),
    )
    op.add_column(
        "employees",
        sa.Column("designation_id", sa.UUID(), nullable=True),
    )

    # 3. Create indexes on assignment columns
    op.create_index(
        "ix_employees_department_id",
        "employees",
        ["department_id"],
        unique=False,
    )
    op.create_index(
        "ix_employees_designation_id",
        "employees",
        ["designation_id"],
        unique=False,
    )

    # 4. Enforce tenant integrity and department-designation compatibility via foreign keys
    op.create_foreign_key(
        "fk_employees_department_org",
        "employees",
        "departments",
        ["organization_id", "department_id"],
        ["organization_id", "id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_employees_designation_org",
        "employees",
        "designations",
        ["organization_id", "designation_id"],
        ["organization_id", "id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_employees_designation_dept_org",
        "employees",
        "designations",
        ["organization_id", "department_id", "designation_id"],
        ["organization_id", "department_id", "id"],
        ondelete="RESTRICT",
    )

    # 5. Check constraint: designation cannot be assigned without a department
    op.create_check_constraint(
        "ck_employees_designation_requires_department",
        "employees",
        "designation_id IS NULL OR department_id IS NOT NULL",
    )


def downgrade() -> None:
    # 1. Drop check constraint
    op.drop_constraint(
        "ck_employees_designation_requires_department",
        "employees",
        type_="check",
    )

    # 2. Drop foreign key constraints
    op.drop_constraint(
        "fk_employees_designation_dept_org",
        "employees",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_employees_designation_org",
        "employees",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_employees_department_org",
        "employees",
        type_="foreignkey",
    )

    # 3. Drop indexes
    op.drop_index("ix_employees_designation_id", table_name="employees")
    op.drop_index("ix_employees_department_id", table_name="employees")

    # 4. Drop columns
    op.drop_column("employees", "designation_id")
    op.drop_column("employees", "department_id")

    # 5. Drop unique constraints from designations
    op.drop_constraint(
        "uq_designations_org_dept_id",
        "designations",
        type_="unique",
    )
    op.drop_constraint(
        "uq_designations_org_id",
        "designations",
        type_="unique",
    )
