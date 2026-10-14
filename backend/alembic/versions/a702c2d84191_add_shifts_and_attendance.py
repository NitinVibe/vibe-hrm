"""add_shifts_and_attendance

Revision ID: a702c2d84191
Revises: e93c4c5a856d
Create Date: 2026-10-13 17:33:06.013013

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a702c2d84191"
down_revision: Union[str, Sequence[str], None] = "e93c4c5a856d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create shifts table
    op.create_table(
        "shifts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("grace_period_minutes", sa.Integer(), server_default=sa.text("15"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_shifts_organization_id",
            ondelete="RESTRICT",
        ),
        sa.UniqueConstraint("organization_id", "id", name="uq_shifts_org_id"),
        sa.CheckConstraint("grace_period_minutes >= 0", name="ck_shifts_grace_period_non_negative"),
        sa.CheckConstraint("start_time != end_time", name="ck_shifts_start_end_different"),
    )
    op.create_index(
        "ix_shifts_organization_id",
        "shifts",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        "uq_shifts_org_name_ci",
        "shifts",
        ["organization_id", sa.text("lower(name)")],
        unique=True,
    )

    # 2. Add composite unique constraint to employees (organization_id, id)
    # Required for composite foreign key references from attendance
    op.create_unique_constraint(
        "uq_employees_org_id",
        "employees",
        ["organization_id", "id"],
    )

    # 3. Add shift_id column and foreign key constraint to employees
    op.add_column(
        "employees",
        sa.Column("shift_id", sa.UUID(), nullable=True),
    )
    op.create_index(
        "ix_employees_shift_id",
        "employees",
        ["shift_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_employees_shift_org",
        "employees",
        "shifts",
        ["organization_id", "shift_id"],
        ["organization_id", "id"],
        ondelete="RESTRICT",
    )

    # 4. Create attendance table
    op.create_table(
        "attendance",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("employee_id", sa.UUID(), nullable=False),
        sa.Column("shift_id", sa.UUID(), nullable=True),
        sa.Column("attendance_date", sa.Date(), nullable=False),
        sa.Column("check_in_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("check_out_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=30), server_default=sa.text("'PRESENT'"), nullable=False),
        sa.Column("late_minutes", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("working_minutes", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("notes", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_attendance_organization_id",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "employee_id"],
            ["employees.organization_id", "employees.id"],
            name="fk_attendance_employee_org",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "shift_id"],
            ["shifts.organization_id", "shifts.id"],
            name="fk_attendance_shift_org",
            ondelete="RESTRICT",
        ),
        sa.UniqueConstraint(
            "organization_id",
            "employee_id",
            "attendance_date",
            name="uq_attendance_org_emp_date",
        ),
        sa.CheckConstraint(
            "status IN ('PRESENT', 'LATE', 'HALF_DAY', 'ABSENT')",
            name="ck_attendance_status_allowed",
        ),
        sa.CheckConstraint(
            "check_out_time IS NULL OR check_in_time IS NULL OR check_out_time >= check_in_time",
            name="ck_attendance_checkout_after_checkin",
        ),
        sa.CheckConstraint(
            "late_minutes >= 0",
            name="ck_attendance_late_minutes_non_negative",
        ),
        sa.CheckConstraint(
            "working_minutes >= 0",
            name="ck_attendance_working_minutes_non_negative",
        ),
    )
    op.create_index(
        "ix_attendance_organization_id",
        "attendance",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        "ix_attendance_employee_id",
        "attendance",
        ["employee_id"],
        unique=False,
    )
    op.create_index(
        "ix_attendance_shift_id",
        "attendance",
        ["shift_id"],
        unique=False,
    )
    op.create_index(
        "ix_attendance_attendance_date",
        "attendance",
        ["attendance_date"],
        unique=False,
    )
    op.create_index(
        "ix_attendance_org_date",
        "attendance",
        ["organization_id", "attendance_date"],
        unique=False,
    )
    op.create_index(
        "ix_attendance_org_status",
        "attendance",
        ["organization_id", "status"],
        unique=False,
    )


def downgrade() -> None:
    # 1. Drop attendance table and its indexes/constraints
    op.drop_table("attendance")

    # 2. Drop foreign key constraint and index from employees
    op.drop_constraint("fk_employees_shift_org", "employees", type_="foreignkey")
    op.drop_index("ix_employees_shift_id", table_name="employees")
    op.drop_column("employees", "shift_id")

    # 3. Drop unique constraint uq_employees_org_id from employees
    op.drop_constraint("uq_employees_org_id", "employees", type_="unique")

    # 4. Drop shifts table and its indexes/constraints
    op.drop_table("shifts")
