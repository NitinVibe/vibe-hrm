"""add_payroll_tables

Revision ID: c3a9d28e71b4
Revises: a702c2d84191
Create Date: 2026-10-14 10:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c3a9d28e71b4"
down_revision: Union[str, Sequence[str], None] = "a702c2d84191"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create employee_salaries table
    op.create_table(
        "employee_salaries",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("employee_id", sa.UUID(), nullable=False),
        sa.Column("basic_salary", sa.Numeric(12, 2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("allowances", sa.Numeric(12, 2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("deductions", sa.Numeric(12, 2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("effective_from", sa.Date(), server_default=sa.func.current_date(), nullable=False),
        sa.Column("payment_method", sa.String(length=50), server_default=sa.text("'BANK_TRANSFER'"), nullable=False),
        sa.Column("bank_name", sa.String(length=100), nullable=True),
        sa.Column("bank_account_number", sa.String(length=50), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_employee_salaries_org",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "employee_id"],
            ["employees.organization_id", "employees.id"],
            name="fk_employee_salaries_emp_org",
            ondelete="RESTRICT",
        ),
        sa.UniqueConstraint("organization_id", "employee_id", name="uq_employee_salaries_org_emp"),
        sa.CheckConstraint("basic_salary >= 0", name="ck_employee_salaries_basic_positive"),
        sa.CheckConstraint("allowances >= 0", name="ck_employee_salaries_allowances_positive"),
        sa.CheckConstraint("deductions >= 0", name="ck_employee_salaries_deductions_positive"),
    )
    op.create_index(
        "ix_employee_salaries_organization_id",
        "employee_salaries",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        "ix_employee_salaries_employee_id",
        "employee_salaries",
        ["employee_id"],
        unique=False,
    )

    # 2. Create payroll_runs table
    op.create_table(
        "payroll_runs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("period_key", sa.String(length=7), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=20), server_default=sa.text("'DRAFT'"), nullable=False),
        sa.Column("total_employees", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("total_gross_pay", sa.Numeric(14, 2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("total_deductions", sa.Numeric(14, 2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("total_net_pay", sa.Numeric(14, 2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("notes", sa.String(length=255), nullable=True),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_payroll_runs_org",
            ondelete="RESTRICT",
        ),
        sa.UniqueConstraint("organization_id", "period_key", name="uq_payroll_runs_org_period"),
        sa.UniqueConstraint("organization_id", "id", name="uq_payroll_runs_org_id"),
        sa.CheckConstraint(
            "status IN ('DRAFT', 'PROCESSED', 'APPROVED', 'PAID')",
            name="ck_payroll_runs_status_allowed",
        ),
        sa.CheckConstraint("start_date <= end_date", name="ck_payroll_runs_date_range"),
        sa.CheckConstraint("total_employees >= 0", name="ck_payroll_runs_total_employees_non_neg"),
        sa.CheckConstraint("total_gross_pay >= 0", name="ck_payroll_runs_gross_non_neg"),
        sa.CheckConstraint("total_deductions >= 0", name="ck_payroll_runs_deductions_non_neg"),
        sa.CheckConstraint("total_net_pay >= 0", name="ck_payroll_runs_net_non_neg"),
    )
    op.create_index(
        "ix_payroll_runs_organization_id",
        "payroll_runs",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        "ix_payroll_runs_period_key",
        "payroll_runs",
        ["period_key"],
        unique=False,
    )
    op.create_index(
        "ix_payroll_runs_status",
        "payroll_runs",
        ["status"],
        unique=False,
    )

    # 3. Create payslips table
    op.create_table(
        "payslips",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("payroll_run_id", sa.UUID(), nullable=False),
        sa.Column("employee_id", sa.UUID(), nullable=False),
        sa.Column("period_key", sa.String(length=7), nullable=False),
        sa.Column("basic_salary", sa.Numeric(12, 2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("allowances", sa.Numeric(12, 2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("deductions", sa.Numeric(12, 2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("gross_pay", sa.Numeric(12, 2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("net_pay", sa.Numeric(12, 2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("payment_status", sa.String(length=20), server_default=sa.text("'PENDING'"), nullable=False),
        sa.Column("payment_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_payslips_org",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "payroll_run_id"],
            ["payroll_runs.organization_id", "payroll_runs.id"],
            name="fk_payslips_run_org",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "employee_id"],
            ["employees.organization_id", "employees.id"],
            name="fk_payslips_emp_org",
            ondelete="RESTRICT",
        ),
        sa.UniqueConstraint("organization_id", "payroll_run_id", "employee_id", name="uq_payslips_org_run_emp"),
        sa.UniqueConstraint("organization_id", "employee_id", "period_key", name="uq_payslips_org_emp_period"),
        sa.CheckConstraint(
            "payment_status IN ('PENDING', 'PAID')",
            name="ck_payslips_status_allowed",
        ),
        sa.CheckConstraint("basic_salary >= 0", name="ck_payslips_basic_non_neg"),
        sa.CheckConstraint("allowances >= 0", name="ck_payslips_allowances_non_neg"),
        sa.CheckConstraint("deductions >= 0", name="ck_payslips_deductions_non_neg"),
        sa.CheckConstraint("gross_pay >= 0", name="ck_payslips_gross_non_neg"),
        sa.CheckConstraint("net_pay >= 0", name="ck_payslips_net_non_neg"),
    )
    op.create_index(
        "ix_payslips_organization_id",
        "payslips",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        "ix_payslips_payroll_run_id",
        "payslips",
        ["payroll_run_id"],
        unique=False,
    )
    op.create_index(
        "ix_payslips_employee_id",
        "payslips",
        ["employee_id"],
        unique=False,
    )
    op.create_index(
        "ix_payslips_payment_status",
        "payslips",
        ["payment_status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("payslips")
    op.drop_table("payroll_runs")
    op.drop_table("employee_salaries")
