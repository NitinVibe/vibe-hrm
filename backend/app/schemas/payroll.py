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


class DepartmentCostBreakdown(BaseModel):
    department_name: str
    employee_count: int
    total_gross_pay: Decimal
    percentage_of_total: Decimal


class PayrollPeriodTrend(BaseModel):
    period_key: str
    total_employees: int
    total_gross_pay: Decimal
    total_net_pay: Decimal
    total_deductions: Decimal


class PayrollCostAnalysisResponse(BaseModel):
    total_gross_cost: Decimal
    total_net_payout: Decimal
    total_deductions: Decimal
    total_employees_paid: int
    average_gross_pay_per_employee: Decimal
    department_breakdown: list[DepartmentCostBreakdown]
    period_trends: list[PayrollPeriodTrend]


class PayrollRunReversalRequest(BaseModel):
    reason: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Audit reason for reversing or rejecting the payroll run",
    )
    target_status: str | None = Field(
        default=None,
        description="Optional target status for approved run ('PROCESSED' or 'DRAFT')",
    )


class PayrollRunPaymentRequest(BaseModel):
    payment_method: str = Field(
        default="BANK_TRANSFER",
        description="Payment disbursement method: BANK_TRANSFER, CHECK, CASH, OTHER",
    )
    payment_reference: str = Field(
        default="MANUAL-RECORD-PAYMENT",
        min_length=3,
        max_length=100,
        description="External disbursement reference (e.g. bank batch ID, check number, or transaction voucher).",
    )
    notes: str | None = Field(
        default=None,
        max_length=255,
        description="Optional payment recording audit notes.",
    )
    confirm_internal_recording: bool = Field(
        default=True,
        description="Acknowledgment that this action records internal payment status only and does not initiate external banking transfers.",
    )


class PayrollAuditLogResponse(BaseModel):
    id: UUID
    organization_id: UUID
    payroll_run_id: UUID
    actor_user_id: UUID | None = None
    actor_email: str | None = None
    action: str
    from_status: str | None = None
    to_status: str
    reason: str | None = None
    notes: str | None = None
    total_employees: int | None = None
    total_gross_pay: Decimal | None = None
    total_deductions: Decimal | None = None
    total_net_pay: Decimal | None = None
    payment_method: str | None = None
    payment_reference: str | None = None
    ip_address: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


