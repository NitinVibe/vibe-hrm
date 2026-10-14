from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKeyConstraint,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.employee import Employee
    from app.models.organization import Organization


class EmployeeSalary(Base):
    __tablename__ = "employee_salaries"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    organization_id: Mapped[UUID] = mapped_column(
        nullable=False,
        index=True,
    )

    employee_id: Mapped[UUID] = mapped_column(
        nullable=False,
        index=True,
    )

    basic_salary: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )

    allowances: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )

    deductions: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )

    effective_from: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        default=date.today,
        server_default=func.current_date(),
    )

    payment_method: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="BANK_TRANSFER",
        server_default=text("'BANK_TRANSFER'"),
    )

    bank_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    bank_account_number: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "employee_id", name="uq_employee_salaries_org_emp"),
        ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_employee_salaries_org",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["organization_id", "employee_id"],
            ["employees.organization_id", "employees.id"],
            name="fk_employee_salaries_emp_org",
            ondelete="RESTRICT",
        ),
        CheckConstraint("basic_salary >= 0", name="ck_employee_salaries_basic_positive"),
        CheckConstraint("allowances >= 0", name="ck_employee_salaries_allowances_positive"),
        CheckConstraint("deductions >= 0", name="ck_employee_salaries_deductions_positive"),
    )

    # Relationships
    organization: Mapped[Organization] = relationship(
        "Organization",
        back_populates="employee_salaries",
        foreign_keys=[organization_id],
        overlaps="employee_salaries,salary_structure,employee",
    )
    employee: Mapped[Employee] = relationship(
        "Employee",
        back_populates="salary_structure",
        foreign_keys=[organization_id, employee_id],
        overlaps="employee_salaries,salary_structure,organization",
    )


    @property
    def gross_salary(self) -> Decimal:
        return Decimal(self.basic_salary) + Decimal(self.allowances)

    @property
    def net_salary(self) -> Decimal:
        net = self.gross_salary - Decimal(self.deductions)
        return max(Decimal("0.00"), net)


class PayrollRun(Base):
    __tablename__ = "payroll_runs"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    organization_id: Mapped[UUID] = mapped_column(
        nullable=False,
        index=True,
    )

    period_key: Mapped[str] = mapped_column(
        String(7),
        nullable=False,
        index=True,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="DRAFT",
        server_default=text("'DRAFT'"),
        index=True,
    )

    total_employees: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )

    total_gross_pay: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )

    total_deductions: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )

    total_net_pay: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )

    notes: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "id", name="uq_payroll_runs_org_id"),
        UniqueConstraint("organization_id", "period_key", name="uq_payroll_runs_org_period"),
        ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_payroll_runs_org",
            ondelete="RESTRICT",
        ),
        CheckConstraint(
            "status IN ('DRAFT', 'PROCESSED', 'APPROVED', 'PAID')",
            name="ck_payroll_runs_status_allowed",
        ),
        CheckConstraint("start_date <= end_date", name="ck_payroll_runs_date_range"),
        CheckConstraint("total_employees >= 0", name="ck_payroll_runs_total_employees_non_neg"),
        CheckConstraint("total_gross_pay >= 0", name="ck_payroll_runs_gross_non_neg"),
        CheckConstraint("total_deductions >= 0", name="ck_payroll_runs_deductions_non_neg"),
        CheckConstraint("total_net_pay >= 0", name="ck_payroll_runs_net_non_neg"),
    )

    # Relationships
    organization: Mapped[Organization] = relationship(
        "Organization",
        back_populates="payroll_runs",
        foreign_keys=[organization_id],
    )
    payslips: Mapped[list[Payslip]] = relationship(
        "Payslip",
        back_populates="payroll_run",
        cascade="all, delete-orphan",
        foreign_keys="[Payslip.organization_id, Payslip.payroll_run_id]",
        overlaps="organization,payslips,employee",
    )



class Payslip(Base):
    __tablename__ = "payslips"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    organization_id: Mapped[UUID] = mapped_column(
        nullable=False,
        index=True,
    )

    payroll_run_id: Mapped[UUID] = mapped_column(
        nullable=False,
        index=True,
    )

    employee_id: Mapped[UUID] = mapped_column(
        nullable=False,
        index=True,
    )

    period_key: Mapped[str] = mapped_column(
        String(7),
        nullable=False,
        index=True,
    )

    basic_salary: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )

    allowances: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )

    deductions: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )

    gross_pay: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )

    net_pay: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )

    payment_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="PENDING",
        server_default=text("'PENDING'"),
        index=True,
    )

    payment_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "payroll_run_id", "employee_id", name="uq_payslips_org_run_emp"),
        UniqueConstraint("organization_id", "employee_id", "period_key", name="uq_payslips_org_emp_period"),
        ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_payslips_org",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["organization_id", "payroll_run_id"],
            ["payroll_runs.organization_id", "payroll_runs.id"],
            name="fk_payslips_run_org",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["organization_id", "employee_id"],
            ["employees.organization_id", "employees.id"],
            name="fk_payslips_emp_org",
            ondelete="RESTRICT",
        ),
        CheckConstraint("payment_status IN ('PENDING', 'PAID')", name="ck_payslips_status_allowed"),
        CheckConstraint("basic_salary >= 0", name="ck_payslips_basic_non_neg"),
        CheckConstraint("allowances >= 0", name="ck_payslips_allowances_non_neg"),
        CheckConstraint("deductions >= 0", name="ck_payslips_deductions_non_neg"),
        CheckConstraint("gross_pay >= 0", name="ck_payslips_gross_non_neg"),
        CheckConstraint("net_pay >= 0", name="ck_payslips_net_non_neg"),
    )

    # Relationships
    organization: Mapped[Organization] = relationship(
        "Organization",
        back_populates="payslips",
        foreign_keys=[organization_id],
        overlaps="payslips,payroll_run,employee",
    )
    payroll_run: Mapped[PayrollRun] = relationship(
        "PayrollRun",
        back_populates="payslips",
        foreign_keys=[organization_id, payroll_run_id],
        overlaps="organization,payslips,employee",
    )
    employee: Mapped[Employee] = relationship(
        "Employee",
        back_populates="payslips",
        foreign_keys=[organization_id, employee_id],
        overlaps="organization,payslips,payroll_run",
    )

