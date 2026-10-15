from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class LeaveBalanceBase(BaseModel):
    year: int = Field(..., ge=2000, le=2100)
    total_days: Decimal = Field(default=Decimal("0.00"), ge=0)


class LeaveBalanceCreate(LeaveBalanceBase):
    employee_id: UUID
    leave_type_id: UUID


class LeaveBalanceUpdate(BaseModel):
    total_days: Decimal | None = Field(None, ge=0)


class LeaveBalanceResponse(BaseModel):
    id: UUID
    organization_id: UUID
    employee_id: UUID
    leave_type_id: UUID
    year: int
    total_days: Decimal
    used_days: Decimal
    pending_days: Decimal
    available_days: Decimal
    leave_type_name: str | None = None
    leave_type_code: str | None = None
    employee_name: str | None = None
    employee_code: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
