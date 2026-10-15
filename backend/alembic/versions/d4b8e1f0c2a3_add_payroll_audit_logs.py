"""add_payroll_audit_logs

Revision ID: d4b8e1f0c2a3
Revises: c3a9d28e71b4
Create Date: 2026-10-15 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d4b8e1f0c2a3"
down_revision: Union[str, Sequence[str], None] = "c3a9d28e71b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "payroll_audit_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("payroll_run_id", sa.UUID(), nullable=False),
        sa.Column("actor_user_id", sa.UUID(), nullable=True),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("from_status", sa.String(length=20), nullable=True),
        sa.Column("to_status", sa.String(length=20), nullable=False),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("total_employees", sa.Integer(), nullable=True),
        sa.Column("total_gross_pay", sa.Numeric(14, 2), nullable=True),
        sa.Column("total_deductions", sa.Numeric(14, 2), nullable=True),
        sa.Column("total_net_pay", sa.Numeric(14, 2), nullable=True),
        sa.Column("payment_method", sa.String(length=50), nullable=True),
        sa.Column("payment_reference", sa.String(length=100), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_payroll_audit_logs_org",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "payroll_run_id"],
            ["payroll_runs.organization_id", "payroll_runs.id"],
            name="fk_payroll_audit_logs_run_org",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["users.id"],
            name="fk_payroll_audit_logs_actor",
            ondelete="SET NULL",
        ),
    )
    op.create_index(
        "ix_payroll_audit_logs_organization_id",
        "payroll_audit_logs",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        "ix_payroll_audit_logs_payroll_run_id",
        "payroll_audit_logs",
        ["payroll_run_id"],
        unique=False,
    )
    op.create_index(
        "ix_payroll_audit_logs_actor_user_id",
        "payroll_audit_logs",
        ["actor_user_id"],
        unique=False,
    )
    op.create_index(
        "ix_payroll_audit_logs_action",
        "payroll_audit_logs",
        ["action"],
        unique=False,
    )
    op.create_index(
        "ix_payroll_audit_logs_created_at",
        "payroll_audit_logs",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_payroll_audit_logs_created_at", table_name="payroll_audit_logs")
    op.drop_index("ix_payroll_audit_logs_action", table_name="payroll_audit_logs")
    op.drop_index("ix_payroll_audit_logs_actor_user_id", table_name="payroll_audit_logs")
    op.drop_index("ix_payroll_audit_logs_payroll_run_id", table_name="payroll_audit_logs")
    op.drop_index("ix_payroll_audit_logs_organization_id", table_name="payroll_audit_logs")
    op.drop_table("payroll_audit_logs")
