from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.designation import Designation
    from app.models.employee import Employee
    from app.models.organization import Organization


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", name="fk_departments_organization_id"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        String(255),
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
        UniqueConstraint("organization_id", "id", name="uq_departments_org_id"),
        Index("uq_departments_org_name_ci", organization_id, func.lower(name), unique=True),
    )

    # Relationships
    organization: Mapped[Organization] = relationship(
        "Organization",
        back_populates="departments",
        foreign_keys=[organization_id],
    )
    designations: Mapped[list[Designation]] = relationship(
        "Designation",
        back_populates="department",
        foreign_keys="[Designation.organization_id, Designation.department_id]",
        overlaps="organization,designations",
    )
    employees: Mapped[list[Employee]] = relationship(
        "Employee",
        back_populates="department",
        foreign_keys="[Employee.organization_id, Employee.department_id]",
        overlaps="organization,departments,employees",
    )
