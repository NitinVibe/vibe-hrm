from __future__ import annotations

from datetime import datetime, time
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Time,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.attendance import Attendance
    from app.models.employee import Employee
    from app.models.organization import Organization


class Shift(Base):
    __tablename__ = "shifts"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", name="fk_shifts_organization_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    start_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    end_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    grace_period_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=15,
        server_default=text("15"),
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
        UniqueConstraint("organization_id", "id", name="uq_shifts_org_id"),
        Index("uq_shifts_org_name_ci", organization_id, func.lower(name), unique=True),
        CheckConstraint("grace_period_minutes >= 0", name="ck_shifts_grace_period_non_negative"),
        CheckConstraint("start_time != end_time", name="ck_shifts_start_end_different"),
    )

    # Relationships
    organization: Mapped[Organization] = relationship(
        "Organization",
        back_populates="shifts",
        foreign_keys=[organization_id],
    )
    employees: Mapped[list[Employee]] = relationship(
        "Employee",
        back_populates="shift",
        foreign_keys="[Employee.organization_id, Employee.shift_id]",
        overlaps="organization,shifts,employees",
    )
    attendance_records: Mapped[list[Attendance]] = relationship(
        "Attendance",
        back_populates="shift",
        foreign_keys="[Attendance.organization_id, Attendance.shift_id]",
        overlaps="organization,shifts,attendance_records",
    )
