from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.employee import Employee
    from app.models.leave_type import LeaveType


class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", name="fk_leave_balances_organization_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    employee_id: Mapped[UUID] = mapped_column(
        ForeignKey("employees.id", name="fk_leave_balances_employee_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    leave_type_id: Mapped[UUID] = mapped_column(
        ForeignKey("leave_types.id", name="fk_leave_balances_leave_type_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    year: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    total_days: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )

    used_days: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )

    pending_days: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
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
        UniqueConstraint("organization_id", "employee_id", "leave_type_id", "year", name="uq_leave_balances_emp_type_year"),
        CheckConstraint("total_days >= 0", name="ck_leave_balances_total_non_neg"),
        CheckConstraint("used_days >= 0", name="ck_leave_balances_used_non_neg"),
        CheckConstraint("pending_days >= 0", name="ck_leave_balances_pending_non_neg"),
    )

    @property
    def available_days(self) -> Decimal:
        avail = Decimal(self.total_days) - Decimal(self.used_days) - Decimal(self.pending_days)
        return max(Decimal("0.00"), avail)

    # Relationships
    organization: Mapped[Organization] = relationship("Organization")
    employee: Mapped[Employee] = relationship("Employee")
    leave_type: Mapped[LeaveType] = relationship("LeaveType", back_populates="balances")
