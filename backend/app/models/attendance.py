from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKeyConstraint,
    Index,
    Integer,
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
    from app.models.shift import Shift


class Attendance(Base):
    __tablename__ = "attendance"

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

    shift_id: Mapped[UUID | None] = mapped_column(
        nullable=True,
        index=True,
    )

    attendance_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    check_in_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    check_out_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PRESENT",
        server_default=text("'PRESENT'"),
    )

    late_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )

    working_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
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
        UniqueConstraint("organization_id", "employee_id", "attendance_date", name="uq_attendance_org_emp_date"),
        ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_attendance_organization_id",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["organization_id", "employee_id"],
            ["employees.organization_id", "employees.id"],
            name="fk_attendance_employee_org",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["organization_id", "shift_id"],
            ["shifts.organization_id", "shifts.id"],
            name="fk_attendance_shift_org",
            ondelete="RESTRICT",
        ),
        CheckConstraint(
            "status IN ('PRESENT', 'LATE', 'HALF_DAY', 'ABSENT')",
            name="ck_attendance_status_allowed",
        ),
        CheckConstraint(
            "check_out_time IS NULL OR check_in_time IS NULL OR check_out_time >= check_in_time",
            name="ck_attendance_checkout_after_checkin",
        ),
        CheckConstraint(
            "late_minutes >= 0",
            name="ck_attendance_late_minutes_non_negative",
        ),
        CheckConstraint(
            "working_minutes >= 0",
            name="ck_attendance_working_minutes_non_negative",
        ),
        Index("ix_attendance_org_date", organization_id, attendance_date),
        Index("ix_attendance_org_status", organization_id, status),
    )

    # Relationships
    organization: Mapped[Organization] = relationship(
        "Organization",
        back_populates="attendance_records",
        foreign_keys=[organization_id],
    )
    employee: Mapped[Employee] = relationship(
        "Employee",
        back_populates="attendance_records",
        foreign_keys=[organization_id, employee_id],
        overlaps="organization,employees,attendance_records",
    )
    shift: Mapped[Shift | None] = relationship(
        "Shift",
        back_populates="attendance_records",
        foreign_keys=[organization_id, shift_id],
        overlaps="organization,shifts,attendance_records,employee",
    )

    @property
    def employee_name(self) -> str | None:
        if not self.employee:
            return None
        return f"{self.employee.first_name} {self.employee.last_name or ''}".strip()

    @property
    def employee_code(self) -> str | None:
        return self.employee.employee_code if self.employee else None

    @property
    def department_name(self) -> str | None:
        return self.employee.department_name if self.employee else None

    @property
    def shift_name(self) -> str | None:
        return self.shift.name if self.shift else None
