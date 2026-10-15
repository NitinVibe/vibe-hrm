from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.employee import Employee
    from app.models.leave_type import LeaveType
    from app.models.user import User


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", name="fk_leave_requests_organization_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    employee_id: Mapped[UUID] = mapped_column(
        ForeignKey("employees.id", name="fk_leave_requests_employee_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    leave_type_id: Mapped[UUID] = mapped_column(
        ForeignKey("leave_types.id", name="fk_leave_requests_leave_type_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    total_days: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    reason: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="PENDING",
        server_default=text("'PENDING'"),
        index=True,
    )

    approver_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", name="fk_leave_requests_approver_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    action_reason: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    action_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
        index=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')",
            name="ck_leave_requests_status_allowed",
        ),
        CheckConstraint("start_date <= end_date", name="ck_leave_requests_date_order"),
        CheckConstraint("total_days > 0", name="ck_leave_requests_days_positive"),
    )

    # Relationships
    organization: Mapped[Organization] = relationship("Organization")
    employee: Mapped[Employee] = relationship("Employee")
    leave_type: Mapped[LeaveType] = relationship("LeaveType", back_populates="requests")
    approver: Mapped[User | None] = relationship("User")
