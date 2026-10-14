from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.attendance import Attendance
    from app.models.department import Department
    from app.models.designation import Designation
    from app.models.organization import Organization
    from app.models.payroll import EmployeeSalary, Payslip
    from app.models.shift import Shift
    from app.models.user import User


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id"),
        nullable=False,
        index=True,
    )

    user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        unique=True,
    )

    employee_code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    last_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    date_of_birth: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    joining_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    employment_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="ACTIVE",
    )

    department_id: Mapped[UUID | None] = mapped_column(
        nullable=True,
        index=True,
    )

    designation_id: Mapped[UUID | None] = mapped_column(
        nullable=True,
        index=True,
    )

    shift_id: Mapped[UUID | None] = mapped_column(
        nullable=True,
        index=True,
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

    __table_args__ = (
        UniqueConstraint("organization_id", "id", name="uq_employees_org_id"),
        ForeignKeyConstraint(
            ["organization_id", "department_id"],
            ["departments.organization_id", "departments.id"],
            name="fk_employees_department_org",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["organization_id", "designation_id"],
            ["designations.organization_id", "designations.id"],
            name="fk_employees_designation_org",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["organization_id", "department_id", "designation_id"],
            ["designations.organization_id", "designations.department_id", "designations.id"],
            name="fk_employees_designation_dept_org",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["organization_id", "shift_id"],
            ["shifts.organization_id", "shifts.id"],
            name="fk_employees_shift_org",
            ondelete="RESTRICT",
        ),
        CheckConstraint(
            "designation_id IS NULL OR department_id IS NOT NULL",
            name="ck_employees_designation_requires_department",
        ),
    )

    # Relationships
    organization: Mapped[Organization] = relationship(
        "Organization",
        back_populates="employees",
    )
    user: Mapped[User | None] = relationship(
        "User",
        back_populates="employee",
    )
    department: Mapped[Department | None] = relationship(
        "Department",
        back_populates="employees",
        foreign_keys=[organization_id, department_id],
        overlaps="organization,departments,employees",
    )
    designation: Mapped[Designation | None] = relationship(
        "Designation",
        back_populates="employees",
        foreign_keys=[organization_id, department_id, designation_id],
        overlaps="organization,department,designations,employees",
    )
    shift: Mapped[Shift | None] = relationship(
        "Shift",
        back_populates="employees",
        foreign_keys=[organization_id, shift_id],
        overlaps="organization,shifts,employees,department,designation",
    )
    attendance_records: Mapped[list[Attendance]] = relationship(
        "Attendance",
        back_populates="employee",
        foreign_keys="[Attendance.organization_id, Attendance.employee_id]",
        overlaps="organization,employees,attendance_records",
    )
    salary_structure: Mapped[EmployeeSalary | None] = relationship(
        "EmployeeSalary",
        back_populates="employee",
        uselist=False,
        foreign_keys="[EmployeeSalary.organization_id, EmployeeSalary.employee_id]",
        cascade="all, delete-orphan",
    )
    payslips: Mapped[list[Payslip]] = relationship(
        "Payslip",
        back_populates="employee",
        foreign_keys="[Payslip.organization_id, Payslip.employee_id]",
    )


    @property
    def department_name(self) -> str | None:
        return self.department.name if self.department else None

    @property
    def designation_name(self) -> str | None:
        return self.designation.name if self.designation else None

    @property
    def shift_name(self) -> str | None:
        return self.shift.name if self.shift else None
