from datetime import datetime, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ShiftBase(BaseModel):
    name: str = Field(..., max_length=100)
    start_time: time
    end_time: time
    grace_period_minutes: int = Field(default=15, ge=0)
    is_active: bool = True


class ShiftCreate(ShiftBase):
    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Shift name cannot be empty or whitespace only")
        return trimmed

    @model_validator(mode="after")
    def validate_times(self) -> "ShiftCreate":
        if self.start_time == self.end_time:
            raise ValueError("Shift start_time and end_time cannot be equal")
        if self.end_time <= self.start_time:
            raise ValueError("Overnight shifts are not supported; end_time must be after start_time")
        return self


class ShiftUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    start_time: time | None = None
    end_time: time | None = None
    grace_period_minutes: int | None = Field(default=None, ge=0)
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def validate_name_not_empty_if_provided(cls, v: str | None) -> str | None:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Shift name cannot be empty or whitespace only")
            return trimmed
        return None

    @model_validator(mode="after")
    def validate_times_if_both_provided(self) -> "ShiftUpdate":
        if self.start_time is not None and self.end_time is not None:
            if self.start_time == self.end_time:
                raise ValueError("Shift start_time and end_time cannot be equal")
            if self.end_time <= self.start_time:
                raise ValueError("Overnight shifts are not supported; end_time must be after start_time")
        return self


class ShiftResponse(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    start_time: time
    end_time: time
    grace_period_minutes: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
