from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.attendance import Attendance
    from app.models.department import Department
    from app.models.designation import Designation
    from app.models.employee import Employee
    from app.models.payroll import EmployeeSalary, PayrollRun, Payslip
    from app.models.shift import Shift
    from app.models.user import User


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True,
        index=True,
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Relationships
    users: Mapped[list[User]] = relationship(
        "User",
        back_populates="organization",
    )
    employees: Mapped[list[Employee]] = relationship(
        "Employee",
        back_populates="organization",
    )
    departments: Mapped[list[Department]] = relationship(
        "Department",
        back_populates="organization",
        foreign_keys="[Department.organization_id]",
    )
    designations: Mapped[list[Designation]] = relationship(
        "Designation",
        back_populates="organization",
        foreign_keys="[Designation.organization_id]",
        overlaps="department,designations",
    )
    shifts: Mapped[list[Shift]] = relationship(
        "Shift",
        back_populates="organization",
        foreign_keys="[Shift.organization_id]",
    )
    attendance_records: Mapped[list[Attendance]] = relationship(
        "Attendance",
        back_populates="organization",
        foreign_keys="[Attendance.organization_id]",
    )
    employee_salaries: Mapped[list[EmployeeSalary]] = relationship(
        "EmployeeSalary",
        back_populates="organization",
        foreign_keys="[EmployeeSalary.organization_id]",
        overlaps="salary_structure,employee",
    )
    payroll_runs: Mapped[list[PayrollRun]] = relationship(
        "PayrollRun",
        back_populates="organization",
        foreign_keys="[PayrollRun.organization_id]",
    )
    payslips: Mapped[list[Payslip]] = relationship(
        "Payslip",
        back_populates="organization",
        foreign_keys="[Payslip.organization_id]",
        overlaps="payslips,payroll_run,employee",
    )


