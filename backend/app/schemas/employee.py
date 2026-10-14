from datetime import date, datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)


class EmployeeBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=30)
    date_of_birth: date | None = None
    joining_date: date | None = None
    employment_status: str = Field(default="ACTIVE", max_length=30)


class EmployeeCreate(EmployeeBase):
    employee_code: str = Field(..., max_length=50)
    user_id: UUID | None = None
    department_id: UUID | None = None
    designation_id: UUID | None = None
    shift_id: UUID | None = None

    @field_validator("employee_code", "first_name")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Field cannot be empty or whitespace only")
        return trimmed

    @field_validator("last_name", "phone", "employment_status")
    @classmethod
    def trim_optional_strings(cls, v: str | None) -> str | None:
        if v is not None:
            trimmed = v.strip()
            return trimmed if trimmed else None
        return None

    @model_validator(mode="after")
    def validate_designation_requires_department(self) -> "EmployeeCreate":
        if self.designation_id is not None and self.department_id is None:
            raise ValueError("designation_id cannot be set without selecting a department_id")
        return self


class EmployeeUpdate(BaseModel):
    employee_code: str | None = Field(default=None, max_length=50)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=30)
    date_of_birth: date | None = None
    joining_date: date | None = None
    employment_status: str | None = Field(default=None, max_length=30)
    user_id: UUID | None = None
    department_id: UUID | None = None
    designation_id: UUID | None = None
    shift_id: UUID | None = None

    @field_validator("employee_code", "first_name")
    @classmethod
    def validate_non_empty_if_provided(cls, v: str | None) -> str | None:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Field cannot be empty or whitespace only")
            return trimmed
        return None

    @field_validator("last_name", "phone", "employment_status")
    @classmethod
    def trim_optional_strings(cls, v: str | None) -> str | None:
        if v is not None:
            trimmed = v.strip()
            return trimmed if trimmed else None
        return None


class EmployeeResponse(BaseModel):
    id: UUID
    organization_id: UUID
    user_id: UUID | None = None
    department_id: UUID | None = None
    designation_id: UUID | None = None
    shift_id: UUID | None = None
    department_name: str | None = None
    designation_name: str | None = None
    shift_name: str | None = None
    employee_code: str
    first_name: str
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    joining_date: date | None = None
    employment_status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
