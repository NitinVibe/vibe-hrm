from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKeyConstraint,
    Index,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.employee import Employee
    from app.models.organization import Organization


class Designation(Base):
    __tablename__ = "designations"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    organization_id: Mapped[UUID] = mapped_column(
        nullable=False,
        index=True,
    )

    department_id: Mapped[UUID] = mapped_column(
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
        UniqueConstraint("organization_id", "id", name="uq_designations_org_id"),
        UniqueConstraint("organization_id", "department_id", "id", name="uq_designations_org_dept_id"),
        ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_designations_organization_id",
        ),
        ForeignKeyConstraint(
            ["organization_id", "department_id"],
            ["departments.organization_id", "departments.id"],
            name="fk_designations_department_org",
        ),
        Index("uq_designations_org_name_ci", organization_id, func.lower(name), unique=True),
    )

    # Relationships
    organization: Mapped[Organization] = relationship(
        "Organization",
        back_populates="designations",
        foreign_keys=[organization_id],
        overlaps="department,designations",
    )
    department: Mapped[Department] = relationship(
        "Department",
        back_populates="designations",
        foreign_keys=[organization_id, department_id],
        overlaps="organization,designations",
    )
    employees: Mapped[list[Employee]] = relationship(
        "Employee",
        back_populates="designation",
        foreign_keys="[Employee.organization_id, Employee.department_id, Employee.designation_id]",
        overlaps="organization,department,designations,employees",
    )
