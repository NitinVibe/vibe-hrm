"""add_leave_management

Revision ID: e5c1a8f7b3d2
Revises: d4b8e1f0c2a3
Create Date: 2026-10-15 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e5c1a8f7b3d2"
down_revision: Union[str, Sequence[str], None] = "d4b8e1f0c2a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. leave_types
    op.create_table(
        "leave_types",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("is_paid", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("default_days_per_year", sa.Numeric(precision=5, scale=2), server_default=sa.text("12.00"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], name="fk_leave_types_organization_id", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "code", name="uq_leave_types_org_code"),
        sa.UniqueConstraint("organization_id", "name", name="uq_leave_types_org_name"),
    )
    op.create_index("ix_leave_types_organization_id", "leave_types", ["organization_id"])

    # 2. leave_policies
    op.create_table(
        "leave_policies",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("leave_type_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("days_allowed", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("carry_forward_days", sa.Numeric(precision=5, scale=2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("max_consecutive_days", sa.Integer(), nullable=True),
        sa.Column("requires_approval", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], name="fk_leave_policies_organization_id", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["leave_type_id"], ["leave_types.id"], name="fk_leave_policies_leave_type_id", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "leave_type_id", name="uq_leave_policies_org_type"),
    )
    op.create_index("ix_leave_policies_organization_id", "leave_policies", ["organization_id"])
    op.create_index("ix_leave_policies_leave_type_id", "leave_policies", ["leave_type_id"])

    # 3. leave_balances
    op.create_table(
        "leave_balances",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("employee_id", sa.UUID(), nullable=False),
        sa.Column("leave_type_id", sa.UUID(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("total_days", sa.Numeric(precision=5, scale=2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("used_days", sa.Numeric(precision=5, scale=2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("pending_days", sa.Numeric(precision=5, scale=2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("total_days >= 0", name="ck_leave_balances_total_non_neg"),
        sa.CheckConstraint("used_days >= 0", name="ck_leave_balances_used_non_neg"),
        sa.CheckConstraint("pending_days >= 0", name="ck_leave_balances_pending_non_neg"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], name="fk_leave_balances_organization_id", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], name="fk_leave_balances_employee_id", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["leave_type_id"], ["leave_types.id"], name="fk_leave_balances_leave_type_id", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "employee_id", "leave_type_id", "year", name="uq_leave_balances_emp_type_year"),
    )
    op.create_index("ix_leave_balances_organization_id", "leave_balances", ["organization_id"])
    op.create_index("ix_leave_balances_employee_id", "leave_balances", ["employee_id"])
    op.create_index("ix_leave_balances_leave_type_id", "leave_balances", ["leave_type_id"])
    op.create_index("ix_leave_balances_year", "leave_balances", ["year"])

    # 4. leave_requests
    op.create_table(
        "leave_requests",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("employee_id", sa.UUID(), nullable=False),
        sa.Column("leave_type_id", sa.UUID(), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("total_days", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("reason", sa.String(length=500), nullable=False),
        sa.Column("status", sa.String(length=20), server_default=sa.text("'PENDING'"), nullable=False),
        sa.Column("approver_id", sa.UUID(), nullable=True),
        sa.Column("action_reason", sa.String(length=500), nullable=True),
        sa.Column("action_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')", name="ck_leave_requests_status_allowed"),
        sa.CheckConstraint("start_date <= end_date", name="ck_leave_requests_date_order"),
        sa.CheckConstraint("total_days > 0", name="ck_leave_requests_days_positive"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], name="fk_leave_requests_organization_id", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], name="fk_leave_requests_employee_id", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["leave_type_id"], ["leave_types.id"], name="fk_leave_requests_leave_type_id", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["approver_id"], ["users.id"], name="fk_leave_requests_approver_id", ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_leave_requests_organization_id", "leave_requests", ["organization_id"])
    op.create_index("ix_leave_requests_employee_id", "leave_requests", ["employee_id"])
    op.create_index("ix_leave_requests_leave_type_id", "leave_requests", ["leave_type_id"])
    op.create_index("ix_leave_requests_status", "leave_requests", ["status"])
    op.create_index("ix_leave_requests_start_date", "leave_requests", ["start_date"])
    op.create_index("ix_leave_requests_end_date", "leave_requests", ["end_date"])


def downgrade() -> None:
    op.drop_table("leave_requests")
    op.drop_table("leave_balances")
    op.drop_table("leave_policies")
    op.drop_table("leave_types")
