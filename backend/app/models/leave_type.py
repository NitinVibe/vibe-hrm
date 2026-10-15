from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.leave_policy import LeavePolicy
    from app.models.leave_balance import LeaveBalance
    from app.models.leave_request import LeaveRequest


class LeaveType(Base):
    __tablename__ = "leave_types"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", name="fk_leave_types_organization_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    code: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    is_paid: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    default_days_per_year: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        default=Decimal("12.00"),
        server_default=text("12.00"),
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
        UniqueConstraint("organization_id", "code", name="uq_leave_types_org_code"),
        UniqueConstraint("organization_id", "name", name="uq_leave_types_org_name"),
    )

    # Relationships
    organization: Mapped[Organization] = relationship("Organization")
    policy: Mapped[LeavePolicy | None] = relationship(
        "LeavePolicy",
        back_populates="leave_type",
        uselist=False,
        cascade="all, delete-orphan",
    )
    balances: Mapped[list[LeaveBalance]] = relationship(
        "LeaveBalance",
        back_populates="leave_type",
        cascade="all, delete-orphan",
    )
    requests: Mapped[list[LeaveRequest]] = relationship(
        "LeaveRequest",
        back_populates="leave_type",
        cascade="all, delete-orphan",
    )
