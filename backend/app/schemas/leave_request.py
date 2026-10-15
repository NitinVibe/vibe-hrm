from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator


class LeaveRequestCreate(BaseModel):
    leave_type_id: UUID
    start_date: date
    end_date: date
    reason: str = Field(..., min_length=1, max_length=500)

    @model_validator(mode="after")
    def validate_date_range(self) -> LeaveRequestCreate:
        if self.start_date > self.end_date:
            raise ValueError("start_date must be less than or equal to end_date")
        return self


class LeaveRequestAction(BaseModel):
    action: Literal["APPROVE", "REJECT"]
    action_reason: str | None = Field(None, max_length=500)


class LeaveRequestResponse(BaseModel):
    id: UUID
    organization_id: UUID
    employee_id: UUID
    leave_type_id: UUID
    start_date: date
    end_date: date
    total_days: Decimal
    reason: str
    status: str
    approver_id: UUID | None = None
    action_reason: str | None = None
    action_at: datetime | None = None
    leave_type_name: str | None = None
    leave_type_code: str | None = None
    employee_name: str | None = None
    employee_code: str | None = None
    approver_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
