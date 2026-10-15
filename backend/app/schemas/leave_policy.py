from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.leave_type import LeaveTypeResponse


class LeavePolicyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=255)
    days_allowed: Decimal = Field(..., gt=0)
    carry_forward_days: Decimal = Field(default=Decimal("0.00"), ge=0)
    max_consecutive_days: int | None = Field(None, gt=0)
    requires_approval: bool = True
    is_active: bool = True


class LeavePolicyCreate(LeavePolicyBase):
    leave_type_id: UUID


class LeavePolicyUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=255)
    days_allowed: Decimal | None = Field(None, gt=0)
    carry_forward_days: Decimal | None = Field(None, ge=0)
    max_consecutive_days: int | None = Field(None, gt=0)
    requires_approval: bool | None = None
    is_active: bool | None = None


class LeavePolicyResponse(LeavePolicyBase):
    id: UUID
    organization_id: UUID
    leave_type_id: UUID
    leave_type: LeaveTypeResponse | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
