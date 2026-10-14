from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DesignationBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: str | None = Field(default=None, max_length=255)
    is_active: bool = Field(default=True)


class DesignationCreate(DesignationBase):
    department_id: UUID

    @field_validator("name")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Designation name cannot be empty or whitespace only")
        return trimmed

    @field_validator("description")
    @classmethod
    def trim_optional_strings(cls, v: str | None) -> str | None:
        if v is not None:
            trimmed = v.strip()
            return trimmed if trimmed else None
        return None


class DesignationUpdate(BaseModel):
    department_id: UUID | None = None
    name: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def validate_non_empty_if_provided(cls, v: str | None) -> str | None:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Designation name cannot be empty or whitespace only")
            return trimmed
        return None

    @field_validator("description")
    @classmethod
    def trim_optional_strings(cls, v: str | None) -> str | None:
        if v is not None:
            trimmed = v.strip()
            return trimmed if trimmed else None
        return None


class DesignationResponse(BaseModel):
    id: UUID
    organization_id: UUID
    department_id: UUID
    name: str
    description: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
