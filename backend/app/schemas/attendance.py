from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CheckInRequest(BaseModel):
    shift_id: UUID | None = None
    check_in_time: datetime | None = None
    notes: str | None = Field(default=None, max_length=255)


class CheckOutRequest(BaseModel):
    check_out_time: datetime | None = None
    notes: str | None = Field(default=None, max_length=255)


class AttendanceResponse(BaseModel):
    id: UUID
    organization_id: UUID
    employee_id: UUID
    shift_id: UUID | None = None
    attendance_date: date
    check_in_time: datetime | None = None
    check_out_time: datetime | None = None
    status: str
    late_minutes: int
    working_minutes: int
    notes: str | None = None
    employee_name: str | None = None
    employee_code: str | None = None
    department_name: str | None = None
    shift_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TodayAttendanceSummary(BaseModel):
    date: date
    total_employees: int
    present_count: int
    late_count: int
    half_day_count: int
    absent_count: int = 0
    not_checked_in_count: int = 0
