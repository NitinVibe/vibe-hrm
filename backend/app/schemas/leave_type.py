from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class LeaveTypeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=20)
    description: str | None = Field(None, max_length=255)
    is_paid: bool = True
    default_days_per_year: Decimal = Field(default=Decimal("12.00"), ge=0)
    is_active: bool = True


class LeaveTypeCreate(LeaveTypeBase):
    pass


class LeaveTypeUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    code: str | None = Field(None, min_length=1, max_length=20)
    description: str | None = Field(None, max_length=255)
    is_paid: bool | None = None
    default_days_per_year: Decimal | None = Field(None, ge=0)
    is_active: bool | None = None


class LeaveTypeResponse(LeaveTypeBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
