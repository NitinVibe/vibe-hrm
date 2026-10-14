from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class EmployeeSalaryBase(BaseModel):
    basic_salary: Decimal = Field(default=Decimal("0.00"), ge=0)
    allowances: Decimal = Field(default=Decimal("0.00"), ge=0)
    deductions: Decimal = Field(default=Decimal("0.00"), ge=0)
    payment_method: str = Field(default="BANK_TRANSFER", max_length=50)
    bank_name: str | None = Field(default=None, max_length=100)
    bank_account_number: str | None = Field(default=None, max_length=50)
    effective_from: date | None = None
    is_active: bool = True


class EmployeeSalaryCreateOrUpdate(EmployeeSalaryBase):
    employee_id: UUID


class EmployeeSalaryResponse(BaseModel):
    id: UUID
    organization_id: UUID
    employee_id: UUID
    employee_name: str | None = None
    employee_code: str | None = None
    department_name: str | None = None
    basic_salary: Decimal
    allowances: Decimal
    deductions: Decimal
    gross_salary: Decimal
    net_salary: Decimal
    payment_method: str
    bank_name: str | None = None
    bank_account_number: str | None = None
    effective_from: date
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PayrollRunCreate(BaseModel):
    period_key: str = Field(..., pattern=r"^\d{4}-(0[1-9]|1[0-2])$", description="Period format YYYY-MM")
    start_date: date
    end_date: date
    notes: str | None = Field(default=None, max_length=255)


class PayrollRunResponse(BaseModel):
    id: UUID
    organization_id: UUID
    period_key: str
    start_date: date
    end_date: date
    status: str
    total_employees: int
    total_gross_pay: Decimal
    total_deductions: Decimal
    total_net_pay: Decimal
    notes: str | None = None
    processed_at: datetime | None = None
    approved_at: datetime | None = None
    paid_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PayslipResponse(BaseModel):
    id: UUID
    organization_id: UUID
    payroll_run_id: UUID
    employee_id: UUID
    employee_name: str | None = None
    employee_code: str | None = None
    department_name: str | None = None
    designation_name: str | None = None
    period_key: str
    basic_salary: Decimal
    allowances: Decimal
    deductions: Decimal
    gross_pay: Decimal
    net_pay: Decimal
    payment_status: str
    payment_date: date | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PayrollDashboardSummary(BaseModel):
    total_gross_payroll: Decimal
    total_net_payroll: Decimal
    total_deductions: Decimal
    pending_approval_runs: int
    total_runs: int
    latest_period: str | None = None
