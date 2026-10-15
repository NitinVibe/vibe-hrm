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


from typing import Any


class EmployeeBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=30)
    date_of_birth: date | None = None
    joining_date: date | None = None
    employment_status: str = Field(default="ACTIVE", max_length=30)

    @field_validator("email", "phone", "date_of_birth", "joining_date", mode="before")
    @classmethod
    def empty_str_to_none_base(cls, v: Any) -> Any:
        if isinstance(v, str) and not v.strip():
            return None
        return v

    @model_validator(mode="after")
    def validate_dates_base(self) -> "EmployeeBase":
        if self.date_of_birth and self.date_of_birth > date.today():
            raise ValueError("Date of birth cannot be in the future")
        if self.date_of_birth and self.joining_date and self.joining_date < self.date_of_birth:
            raise ValueError("Joining date must be after date of birth")
        return self


class EmployeeCreate(EmployeeBase):
    employee_code: str = Field(..., max_length=50)
    user_id: UUID | None = None
    department_id: UUID | None = None
    designation_id: UUID | None = None
    shift_id: UUID | None = None

    @field_validator("user_id", "department_id", "designation_id", "shift_id", mode="before")
    @classmethod
    def empty_str_to_none_create(cls, v: Any) -> Any:
        if isinstance(v, str) and not v.strip():
            return None
        return v

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

    @field_validator(
        "email",
        "phone",
        "date_of_birth",
        "joining_date",
        "user_id",
        "department_id",
        "designation_id",
        "shift_id",
        mode="before",
    )
    @classmethod
    def empty_str_to_none_update(cls, v: Any) -> Any:
        if isinstance(v, str) and not v.strip():
            return None
        return v

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

    @model_validator(mode="after")
    def validate_dates_update(self) -> "EmployeeUpdate":
        if self.date_of_birth and self.date_of_birth > date.today():
            raise ValueError("Date of birth cannot be in the future")
        if self.date_of_birth and self.joining_date and self.joining_date < self.date_of_birth:
            raise ValueError("Joining date must be after date of birth")
        return self


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


class EmployeeAccountCreate(BaseModel):
    password: str = Field(..., min_length=8, max_length=128)
    email: EmailStr | None = Field(default=None, max_length=255)
    role_name: str = Field(default="EMPLOYEE", max_length=50)

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class EmployeePasswordReset(BaseModel):
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class EmployeeAccountStatusResponse(BaseModel):
    has_account: bool
    user_id: UUID | None = None
    email: str | None = None
    role_name: str | None = None
    is_active: bool = False
    is_verified: bool = False

    model_config = ConfigDict(from_attributes=True)
