from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.permissions import get_current_user, require_roles
from app.db.session import get_db
from app.models.payroll import EmployeeSalary, Payslip
from app.models.user import User
from app.schemas.payroll import (
    EmployeeSalaryCreateOrUpdate,
    EmployeeSalaryResponse,
    PayrollAuditLogResponse,
    PayrollCostAnalysisResponse,
    PayrollDashboardSummary,
    PayrollRunCreate,
    PayrollRunPaymentRequest,
    PayrollRunReversalRequest,
    PayrollRunResponse,
    PayslipResponse,
)
from app.services import payroll as payroll_service

router = APIRouter(prefix="/payroll", tags=["Payroll"])

PAYROLL_ADMIN_ROLES = ("SUPER_ADMIN", "ORG_ADMIN", "HR")


def _format_salary_response(salary: EmployeeSalary) -> EmployeeSalaryResponse:
    emp = salary.employee
    name = f"{emp.first_name} {emp.last_name or ''}".strip() if emp else None
    code = emp.employee_code if emp else None
    dept = emp.department_name if emp else None

    return EmployeeSalaryResponse(
        id=salary.id,
        organization_id=salary.organization_id,
        employee_id=salary.employee_id,
        employee_name=name,
        employee_code=code,
        department_name=dept,
        basic_salary=salary.basic_salary,
        allowances=salary.allowances,
        deductions=salary.deductions,
        gross_salary=salary.gross_salary,
        net_salary=salary.net_salary,
        payment_method=salary.payment_method,
        bank_name=salary.bank_name,
        bank_account_number=salary.bank_account_number,
        effective_from=salary.effective_from,
        is_active=salary.is_active,
        created_at=salary.created_at,
        updated_at=salary.updated_at,
    )


def _format_payslip_response(p: Payslip) -> PayslipResponse:
    emp = p.employee
    name = f"{emp.first_name} {emp.last_name or ''}".strip() if emp else None
    code = emp.employee_code if emp else None
    dept = emp.department_name if emp else None
    desig = emp.designation_name if emp else None

    return PayslipResponse(
        id=p.id,
        organization_id=p.organization_id,
        payroll_run_id=p.payroll_run_id,
        employee_id=p.employee_id,
        employee_name=name,
        employee_code=code,
        department_name=dept,
        designation_name=desig,
        period_key=p.period_key,
        basic_salary=p.basic_salary,
        allowances=p.allowances,
        deductions=p.deductions,
        gross_pay=p.gross_pay,
        net_pay=p.net_pay,
        payment_status=p.payment_status,
        payment_date=p.payment_date,
        notes=p.notes,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


# ---------------------------------------------------------
# Dashboard & Summary
# ---------------------------------------------------------

@router.get(
    "/summary",
    response_model=PayrollDashboardSummary,
    summary="Get payroll overview metrics",
)
def get_payroll_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
):
    return payroll_service.get_dashboard_summary(db, current_user.organization_id)


@router.get(
    "/analytics/cost-analysis",
    response_model=PayrollCostAnalysisResponse,
    summary="Get aggregated payroll cost analysis and department breakdown",
)
def get_cost_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
):
    return payroll_service.get_cost_analysis(db, current_user.organization_id)


# ---------------------------------------------------------
# Salary Structures (HR & Admin)
# ---------------------------------------------------------

@router.get(
    "/salaries",
    response_model=list[EmployeeSalaryResponse],
    summary="List employee salary structures",
)
def list_employee_salaries(
    department_id: UUID | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
):
    salaries = payroll_service.list_employee_salaries(
        db,
        current_user.organization_id,
        department_id=department_id,
        search=search,
    )
    return [_format_salary_response(s) for s in salaries]


@router.post(
    "/salaries",
    response_model=EmployeeSalaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Create or update employee salary structure",
)
def set_employee_salary(
    payload: EmployeeSalaryCreateOrUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
):
    salary = payroll_service.upsert_employee_salary(
        db,
        current_user.organization_id,
        payload,
    )
    return _format_salary_response(salary)


@router.get(
    "/salaries/{employee_id}",
    response_model=EmployeeSalaryResponse,
    summary="Get specific employee salary structure",
)
def get_employee_salary(
    employee_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
):
    salary = payroll_service.get_employee_salary(
        db,
        current_user.organization_id,
        employee_id,
    )
    if not salary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee salary record not found",
        )
    return _format_salary_response(salary)


# ---------------------------------------------------------
# Payroll Runs & Processing (HR & Admin)
# ---------------------------------------------------------

@router.get(
    "/runs",
    response_model=list[PayrollRunResponse],
    summary="List all payroll runs",
)
def list_payroll_runs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
):
    return payroll_service.list_payroll_runs(db, current_user.organization_id)


@router.post(
    "/runs",
    response_model=PayrollRunResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new payroll run",
)
def create_payroll_run(
    payload: PayrollRunCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
    request: Request = None,
):
    ip = request.client.host if request and request.client else None
    return payroll_service.create_payroll_run(
        db,
        current_user.organization_id,
        payload,
        actor_user_id=current_user.id,
        ip_address=ip,
    )


@router.get(
    "/runs/{run_id}",
    response_model=PayrollRunResponse,
    summary="Get details of a payroll run",
)
def get_payroll_run(
    run_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
):
    run = payroll_service.get_payroll_run(db, current_user.organization_id, run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found",
        )
    return run


@router.post(
    "/runs/{run_id}/process",
    response_model=PayrollRunResponse,
    summary="Calculate and process payroll for a run",
)
def process_payroll_run(
    run_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
    request: Request = None,
):
    ip = request.client.host if request and request.client else None
    return payroll_service.process_payroll_run(
        db,
        current_user.organization_id,
        run_id,
        actor_user_id=current_user.id,
        ip_address=ip,
    )


@router.post(
    "/runs/{run_id}/approve",
    response_model=PayrollRunResponse,
    summary="Approve a processed payroll run",
)
def approve_payroll_run(
    run_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
    request: Request = None,
):
    ip = request.client.host if request and request.client else None
    return payroll_service.approve_payroll_run(
        db,
        current_user.organization_id,
        run_id,
        actor_user_id=current_user.id,
        ip_address=ip,
    )


@router.post(
    "/runs/{run_id}/pay",
    response_model=PayrollRunResponse,
    summary="Record payment for an approved payroll run",
)
def mark_payroll_run_paid(
    run_id: UUID,
    payload: PayrollRunPaymentRequest | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
    request: Request = None,
):
    ip = request.client.host if request and request.client else None
    return payroll_service.mark_payroll_run_paid(
        db,
        current_user.organization_id,
        run_id,
        payload=payload,
        actor_user_id=current_user.id,
        ip_address=ip,
    )


@router.delete(
    "/runs/{run_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an uncalculated draft payroll run",
)
def delete_payroll_run(
    run_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
    request: Request = None,
):
    ip = request.client.host if request and request.client else None
    payroll_service.delete_payroll_run(
        db,
        current_user.organization_id,
        run_id,
        actor_user_id=current_user.id,
        ip_address=ip,
    )
    return None


@router.post(
    "/runs/{run_id}/return-to-draft",
    response_model=PayrollRunResponse,
    summary="Return a processed payroll run back to draft status",
)
def return_payroll_run_to_draft(
    run_id: UUID,
    payload: PayrollRunReversalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
    request: Request = None,
):
    ip = request.client.host if request and request.client else None
    return payroll_service.return_payroll_run_to_draft(
        db,
        current_user.organization_id,
        run_id,
        payload.reason,
        current_user.email,
        actor_user_id=current_user.id,
        ip_address=ip,
    )


@router.post(
    "/runs/{run_id}/reverse-approval",
    response_model=PayrollRunResponse,
    summary="Reverse or reject approval for an approved payroll run",
)
def reverse_payroll_run_approval(
    run_id: UUID,
    payload: PayrollRunReversalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
    request: Request = None,
):
    ip = request.client.host if request and request.client else None
    target_status = payload.target_status or "PROCESSED"
    return payroll_service.reverse_payroll_run_approval(
        db,
        current_user.organization_id,
        run_id,
        payload.reason,
        target_status,
        current_user.email,
        actor_user_id=current_user.id,
        ip_address=ip,
    )


@router.post(
    "/runs/{run_id}/reverse",
    response_model=PayrollRunResponse,
    summary="Controlled, audited reversal for a payroll run based on current lifecycle stage",
)
def reverse_payroll_run(
    run_id: UUID,
    payload: PayrollRunReversalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
    request: Request = None,
):
    ip = request.client.host if request and request.client else None
    return payroll_service.reverse_payroll_run(
        db,
        current_user.organization_id,
        run_id,
        payload.reason,
        payload.target_status,
        current_user.email,
        actor_user_id=current_user.id,
        ip_address=ip,
    )


@router.get(
    "/runs/{run_id}/audit-logs",
    response_model=list[PayrollAuditLogResponse],
    summary="Get immutable audit logs for a specific payroll run",
)
def get_payroll_run_audit_logs(
    run_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
):
    run = payroll_service.get_payroll_run(db, current_user.organization_id, run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found",
        )
    logs = payroll_service.list_payroll_audit_logs(
        db,
        current_user.organization_id,
        run_id=run_id,
    )
    result = []
    for l in logs:
        resp = PayrollAuditLogResponse.model_validate(l)
        if l.actor_user:
            resp.actor_email = l.actor_user.email
        result.append(resp)
    return result


@router.get(
    "/audit-logs",
    response_model=list[PayrollAuditLogResponse],
    summary="List organization payroll audit logs",
)
def list_payroll_audit_logs(
    run_id: UUID | None = Query(None, description="Optional payroll run ID filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
):
    logs = payroll_service.list_payroll_audit_logs(
        db,
        current_user.organization_id,
        run_id=run_id,
    )
    result = []
    for l in logs:
        resp = PayrollAuditLogResponse.model_validate(l)
        if l.actor_user:
            resp.actor_email = l.actor_user.email
        result.append(resp)
    return result


@router.get(
    "/runs/{run_id}/payslips",
    response_model=list[PayslipResponse],
    summary="List payslips generated for a payroll run",
)
def list_run_payslips(
    run_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
):
    run = payroll_service.get_payroll_run(db, current_user.organization_id, run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found",
        )
    payslips = payroll_service.list_payslips_for_run(db, current_user.organization_id, run_id)
    return [_format_payslip_response(p) for p in payslips]


@router.get(
    "/payslips",
    response_model=list[PayslipResponse],
    summary="List all organization payslips with optional filtering",
)
def list_organization_payslips(
    period_key: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    department_id: UUID | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ADMIN_ROLES)),
):
    clean_period = period_key if isinstance(period_key, str) else None
    clean_dept = department_id if isinstance(department_id, UUID) else None
    clean_search = search if isinstance(search, str) else None
    payslips = payroll_service.list_organization_payslips(
        db,
        current_user.organization_id,
        period_key=clean_period,
        department_id=clean_dept,
        search=clean_search,
    )
    return [_format_payslip_response(p) for p in payslips]


# ---------------------------------------------------------
# Employee Self-Service (Authenticated User)
# ---------------------------------------------------------

@router.get(
    "/my-salary",
    response_model=EmployeeSalaryResponse,
    summary="Get current authenticated user's salary structure",
)
def get_my_salary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    salary = payroll_service.get_my_salary(
        db,
        current_user.organization_id,
        current_user.id,
    )
    if not salary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No salary structure configured for current employee",
        )
    return _format_salary_response(salary)


@router.get(
    "/my-payslips",
    response_model=list[PayslipResponse],
    summary="Get current authenticated user's payslips",
)
def list_my_payslips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payslips = payroll_service.list_my_payslips(
        db,
        current_user.organization_id,
        current_user.id,
    )
    return [_format_payslip_response(p) for p in payslips]
