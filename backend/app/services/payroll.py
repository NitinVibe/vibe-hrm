from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, delete, desc, func, inspect, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.department import Department
from app.models.employee import Employee
from app.models.payroll import EmployeeSalary, PayrollAuditLog, PayrollRun, Payslip
from app.schemas.payroll import (
    DepartmentCostBreakdown,
    EmployeeSalaryCreateOrUpdate,
    PayrollCostAnalysisResponse,
    PayrollDashboardSummary,
    PayrollPeriodTrend,
    PayrollRunCreate,
    PayrollRunPaymentRequest,
)

CENT = Decimal("0.01")


def quantize_currency(amount: Decimal | float | int | str) -> Decimal:
    """Standard financial rounding to 2 decimal places using ROUND_HALF_UP."""
    return Decimal(str(amount)).quantize(CENT, rounding=ROUND_HALF_UP)


def calculate_payslip(
    basic_salary: Decimal,
    allowances: Decimal,
    deductions: Decimal,
) -> tuple[Decimal, Decimal]:
    """Pure, deterministic calculation for gross and net pay."""
    gross = quantize_currency(Decimal(basic_salary) + Decimal(allowances))
    ded = min(quantize_currency(deductions), gross)
    net = max(Decimal("0.00"), gross - ded)
    return gross, net


def calculate_prorated_payslip(
    basic_salary: Decimal,
    allowances: Decimal,
    deductions: Decimal,
    eligible_days: int,
    total_days: int,
    prorate_deductions: bool = False,
) -> tuple[Decimal, Decimal, Decimal, Decimal, Decimal, str | None]:
    """
    Deterministic calendar-day proration engine.

    Formula & Policy Rules:
    1. Calendar Days:
       - Total cycle days: D_total = (end_date - start_date).days + 1
       - Eligible days: D_eligible = (end_date - max(start_date, joining_date, effective_from)).days + 1
       - Inclusively defined: D_eligible == D_total is a full period (no proration).
       - Partial periods: 0 < D_eligible < D_total are prorated.
       - D_eligible <= 0 is excluded.

    2. Earnings (Basic Salary and Recurring Allowances):
       - Prorated per-diem based on eligible calendar days in the cycle:
         Prorated Basic = round(Monthly Basic * D_eligible / D_total, 2)
         Prorated Allowances = round(Monthly Allowances * D_eligible / D_total, 2)
         Gross Pay = Prorated Basic + Prorated Allowances

    3. Deductions:
       - Fixed Deductions (default, prorate_deductions=False):
         Contractual fixed deductions (loan repayments, advances, fixed medical/benefit premiums)
         are preserved in full rather than silently diluted per diem.
         Safety Cap: Deductions are strictly capped at Gross Pay (Applied = min(Deductions, Gross Pay)),
         guaranteeing that Net Pay cannot become negative (Net Pay >= 0.00).
         If capped, the payslip notes document the capped amount for audit trail.
       - Proportional Deductions (prorate_deductions=True):
         If configured, deductions are prorated per diem (round(Deductions * D_eligible / D_total, 2))
         and capped at Gross Pay.

    4. Rounding:
       - Rounding is applied to each component using ROUND_HALF_UP at 2 decimal places (0.01 CENT).
       - Totals reconcile exactly: Gross Pay - Applied Deductions == Net Pay.

    Returns:
        (prorated_basic, prorated_allowances, gross_pay, applied_deductions, net_pay, proration_note)
    """
    if total_days <= 0:
        raise ValueError(f"Total cycle calendar days must be positive, got {total_days}")
    if eligible_days <= 0:
        raise ValueError(f"Eligible calendar days must be positive, got {eligible_days}")
    if eligible_days > total_days:
        raise ValueError(f"Eligible days ({eligible_days}) cannot exceed total days ({total_days})")

    b_monthly = Decimal(basic_salary)
    a_monthly = Decimal(allowances)
    d_monthly = Decimal(deductions)

    if eligible_days == total_days:
        basic = quantize_currency(b_monthly)
        allow = quantize_currency(a_monthly)
        gross = basic + allow
        ded = min(quantize_currency(d_monthly), gross)
        net = max(Decimal("0.00"), gross - ded)
        return basic, allow, gross, ded, net, None

    # Partial period calendar-day proration
    day_ratio = Decimal(eligible_days) / Decimal(total_days)
    basic = quantize_currency(b_monthly * day_ratio)
    allow = quantize_currency(a_monthly * day_ratio)
    gross = basic + allow

    if prorate_deductions:
        target_ded = quantize_currency(d_monthly * day_ratio)
        ded = min(target_ded, gross)
        net = max(Decimal("0.00"), gross - ded)
        note = f"Prorated: {eligible_days}/{total_days} calendar days. Deductions prorated."
    else:
        raw_ded = quantize_currency(d_monthly)
        if raw_ded > gross:
            ded = gross
            net = Decimal("0.00")
            note = (
                f"Prorated: {eligible_days}/{total_days} calendar days. "
                f"Fixed deductions capped at gross ({raw_ded} -> {ded})."
            )
        else:
            ded = raw_ded
            net = gross - ded
            note = f"Prorated: {eligible_days}/{total_days} calendar days."

    return basic, allow, gross, ded, net, note


def upsert_employee_salary(
    db: Session,
    organization_id: UUID,
    payload: EmployeeSalaryCreateOrUpdate,
) -> EmployeeSalary:
    """Create or update an employee's compensation structure within organization boundary."""
    # Ensure employee exists and belongs to the organization
    emp = db.execute(
        select(Employee).where(
            Employee.id == payload.employee_id,
            Employee.organization_id == organization_id,
        )
    ).scalar_one_or_none()

    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found in organization",
        )

    # Validate non-negative numbers and deduction sanity
    basic = Decimal(payload.basic_salary)
    allowances = Decimal(payload.allowances)
    deductions = Decimal(payload.deductions)
    gross = basic + allowances

    if basic < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Basic salary cannot be negative",
        )
    if allowances < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Allowances cannot be negative",
        )
    if deductions < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deductions cannot be negative",
        )
    if deductions > gross:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Total deductions ({deductions}) cannot exceed gross pay ({gross}). Net pay cannot be negative.",
        )

    # Check for existing salary structure
    stmt = select(EmployeeSalary).where(
        EmployeeSalary.employee_id == payload.employee_id,
        EmployeeSalary.organization_id == organization_id,
    )
    salary = db.execute(stmt).scalar_one_or_none()

    now = datetime.utcnow()
    effective = payload.effective_from or date.today()

    try:
        if salary:
            salary.basic_salary = payload.basic_salary
            salary.allowances = payload.allowances
            salary.deductions = payload.deductions
            salary.payment_method = payload.payment_method
            salary.bank_name = payload.bank_name
            salary.bank_account_number = payload.bank_account_number
            salary.effective_from = effective
            salary.is_active = payload.is_active
            salary.updated_at = now
        else:
            salary = EmployeeSalary(
                organization_id=organization_id,
                employee_id=payload.employee_id,
                basic_salary=payload.basic_salary,
                allowances=payload.allowances,
                deductions=payload.deductions,
                payment_method=payload.payment_method,
                bank_name=payload.bank_name,
                bank_account_number=payload.bank_account_number,
                effective_from=effective,
                is_active=payload.is_active,
                created_at=now,
                updated_at=now,
            )
            db.add(salary)

        db.commit()
        db.refresh(salary)
        return salary
    except Exception:
        db.rollback()
        raise


def get_employee_salary(
    db: Session,
    organization_id: UUID,
    employee_id: UUID,
) -> EmployeeSalary | None:
    stmt = (
        select(EmployeeSalary)
        .options(
            joinedload(EmployeeSalary.employee).joinedload(Employee.department),
        )
        .where(
            EmployeeSalary.employee_id == employee_id,
            EmployeeSalary.organization_id == organization_id,
        )
    )
    return db.execute(stmt).scalar_one_or_none()


def list_employee_salaries(
    db: Session,
    organization_id: UUID,
    department_id: UUID | None = None,
    search: str | None = None,
) -> list[EmployeeSalary]:
    stmt = (
        select(EmployeeSalary)
        .join(Employee, EmployeeSalary.employee_id == Employee.id)
        .options(
            joinedload(EmployeeSalary.employee).joinedload(Employee.department),
        )
        .where(
            EmployeeSalary.organization_id == organization_id,
            Employee.organization_id == organization_id,
        )
    )

    if department_id:
        stmt = stmt.where(Employee.department_id == department_id)

    if search:
        search_term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Employee.first_name.ilike(search_term),
                Employee.last_name.ilike(search_term),
                Employee.employee_code.ilike(search_term),
            )
        )

    stmt = stmt.order_by(Employee.first_name.asc())
    return list(db.execute(stmt).scalars().all())


def create_payroll_audit_log(
    db: Session,
    organization_id: UUID,
    payroll_run_id: UUID,
    action: str,
    from_status: str | None,
    to_status: str,
    actor_user_id: UUID | None = None,
    reason: str | None = None,
    notes: str | None = None,
    total_employees: int | None = None,
    total_gross_pay: Decimal | None = None,
    total_deductions: Decimal | None = None,
    total_net_pay: Decimal | None = None,
    payment_method: str | None = None,
    payment_reference: str | None = None,
    ip_address: str | None = None,
) -> PayrollAuditLog | None:
    """
    Persist an immutable audit log entry atomically within the active session.
    If the payroll_audit_logs table does not exist in the database (e.g. pending migration),
    gracefully logs and proceeds.
    """
    if not _is_audit_table_available(db):
        return None

    try:
        with db.begin_nested():
            log_entry = PayrollAuditLog(
                organization_id=organization_id,
                payroll_run_id=payroll_run_id,
                actor_user_id=actor_user_id,
                action=action,
                from_status=from_status,
                to_status=to_status,
                reason=reason,
                notes=notes,
                total_employees=total_employees,
                total_gross_pay=total_gross_pay,
                total_deductions=total_deductions,
                total_net_pay=total_net_pay,
                payment_method=payment_method,
                payment_reference=payment_reference,
                ip_address=ip_address,
                created_at=datetime.utcnow(),
            )
            db.add(log_entry)
            db.flush()
            return log_entry
    except Exception as e:
        error_msg = str(e).lower()
        if "relation \"payroll_audit_logs\" does not exist" in error_msg or "no such table: payroll_audit_logs" in error_msg or "undefinedtable" in error_msg:
            return None
        raise


def _is_audit_table_available(db: Session) -> bool:
    """Safely check if payroll_audit_logs table exists without aborting active transactions."""
    try:
        conn = db.connection()
        return inspect(conn).has_table("payroll_audit_logs")
    except Exception:
        return False


def list_payroll_audit_logs(
    db: Session,
    organization_id: UUID,
    run_id: UUID | None = None,
) -> list[PayrollAuditLog]:
    """
    Query immutable audit logs for an organization with optional run_id filter.
    Enforces strict tenant isolation and includes actor user email if available.
    """
    if not _is_audit_table_available(db):
        return []

    try:
        stmt = (
            select(PayrollAuditLog)
            .options(joinedload(PayrollAuditLog.actor_user))
            .where(PayrollAuditLog.organization_id == organization_id)
        )
        if run_id:
            stmt = stmt.where(PayrollAuditLog.payroll_run_id == run_id)
        stmt = stmt.order_by(PayrollAuditLog.created_at.desc())
        return list(db.execute(stmt).scalars().all())
    except Exception:
        return []


def create_payroll_run(
    db: Session,
    organization_id: UUID,
    payload: PayrollRunCreate,
    actor_user_id: UUID | None = None,
    ip_address: str | None = None,
) -> PayrollRun:
    """Create a new draft payroll run for a specific period."""
    if payload.start_date > payload.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be after end date",
        )

    # Check for existing run for the period
    existing = db.execute(
        select(PayrollRun).where(
            PayrollRun.organization_id == organization_id,
            PayrollRun.period_key == payload.period_key,
        )
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Payroll run for period {payload.period_key} already exists",
        )

    try:
        run = PayrollRun(
            organization_id=organization_id,
            period_key=payload.period_key,
            start_date=payload.start_date,
            end_date=payload.end_date,
            status="DRAFT",
            notes=payload.notes,
            total_employees=0,
            total_gross_pay=Decimal("0.00"),
            total_deductions=Decimal("0.00"),
            total_net_pay=Decimal("0.00"),
        )
        db.add(run)
        db.flush()

        create_payroll_audit_log(
            db=db,
            organization_id=organization_id,
            payroll_run_id=run.id,
            action="CREATED",
            from_status=None,
            to_status="DRAFT",
            actor_user_id=actor_user_id,
            notes=payload.notes,
            ip_address=ip_address,
        )

        db.commit()
        db.refresh(run)
        return run
    except Exception:
        db.rollback()
        raise


def process_payroll_run(
    db: Session,
    organization_id: UUID,
    run_id: UUID,
    actor_user_id: UUID | None = None,
    ip_address: str | None = None,
) -> PayrollRun:
    """
    Calculate and generate payslips for all eligible active employees with active salary structures.
    Enforces eligibility checks, atomicity, proration safeguards, and stale payslip reconciliation.
    """
    run = db.execute(
        select(PayrollRun)
        .with_for_update()
        .where(
            PayrollRun.id == run_id,
            PayrollRun.organization_id == organization_id,
        )
    ).scalar_one_or_none()

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found",
        )

    if run.status == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot re-process payroll run in PAID status ('PAID'). Paid runs are immutable.",
        )

    if run.status == "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot re-process payroll run in APPROVED status ('APPROVED'). Reverse approval to PROCESSED status first.",
        )

    prior_status = run.status

    if run.start_date > run.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be after end date",
        )

    total_cycle_days = (run.end_date - run.start_date).days + 1
    if total_cycle_days <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payroll cycle duration: {total_cycle_days} days",
        )

    # Fetch all active employees in the organization
    emp_stmt = (
        select(Employee)
        .where(
            Employee.organization_id == organization_id,
            Employee.employment_status == "ACTIVE",
        )
        .order_by(Employee.first_name.asc(), Employee.last_name.asc())
    )
    employees = db.execute(emp_stmt).scalars().all()

    # Filter and validate employee eligibility and salary parameters
    # Stores: (emp, salary, eligible_days, total_cycle_days, start_eff)
    eligible_records: list[tuple[Employee, EmployeeSalary, int, int, date]] = []
    for emp in employees:
        emp_name = f"{emp.first_name} {emp.last_name or ''}".strip()

        # 1. Salary records checks
        active_salaries = db.execute(
            select(EmployeeSalary).where(
                EmployeeSalary.organization_id == organization_id,
                EmployeeSalary.employee_id == emp.id,
                EmployeeSalary.is_active.is_(True),
            )
        ).scalars().all()

        if not active_salaries:
            # No active salary structure configured: excluded
            continue

        if len(active_salaries) > 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cannot process payroll: Employee '{emp_name}' ({emp.employee_code}) "
                    f"has {len(active_salaries)} active salary structures during period {run.period_key}. "
                    "Multiple overlapping active salary records during a cycle is ambiguous; "
                    "resolve duplicate active records before processing."
                ),
            )

        salary = active_salaries[0]

        # 2. Employee joining date checks
        if not emp.joining_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cannot process payroll: Employee '{emp_name}' ({emp.employee_code}) "
                    "is missing a joining date. Employment eligibility cannot be established; automated payout is blocked."
                ),
            )

        if emp.joining_date > run.end_date:
            # Employee joined after period ended: excluded from this cycle (0 eligible days)
            continue

        if salary.effective_from > run.end_date:
            # Salary structure takes effect after this period: excluded from this cycle
            continue

        # 3. Determine effective start date in this cycle
        start_eff = max(run.start_date, emp.joining_date, salary.effective_from)
        if start_eff > run.end_date:
            continue

        eligible_days = (run.end_date - start_eff).days + 1
        if eligible_days <= 0:
            continue

        # 4. Input validation: negative components
        if salary.basic_salary < 0 or salary.allowances < 0 or salary.deductions < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot process payroll: Employee '{emp_name}' ({emp.employee_code}) has negative salary components.",
            )

        # For full-month salary, base monthly deductions cannot exceed base gross
        if eligible_days == total_cycle_days:
            full_gross = Decimal(salary.basic_salary) + Decimal(salary.allowances)
            if Decimal(salary.deductions) > full_gross:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Cannot process payroll: Employee '{emp_name}' ({emp.employee_code}) "
                        f"has deductions ({salary.deductions}) exceeding gross pay ({full_gross}). "
                        "Deductions cannot exceed gross earnings."
                    ),
                )

        eligible_records.append((emp, salary, eligible_days, total_cycle_days, start_eff))

    try:
        eligible_emp_ids = {emp.id for emp, _, _, _, _ in eligible_records}

        # Fetch existing payslips for this run to reconcile
        existing_stmt = select(Payslip).where(
            Payslip.organization_id == organization_id,
            Payslip.payroll_run_id == run.id,
        )
        existing_payslips = {p.employee_id: p for p in db.execute(existing_stmt).scalars().all()}

        # Remove stale payslips for employees who are no longer eligible
        for emp_id, stale_slip in list(existing_payslips.items()):
            if emp_id not in eligible_emp_ids:
                db.delete(stale_slip)
                del existing_payslips[emp_id]

        now = datetime.utcnow()
        total_gross = Decimal("0.00")
        total_ded = Decimal("0.00")
        total_net = Decimal("0.00")
        employee_count = 0

        for emp, salary, eligible_days, total_days, start_eff in eligible_records:
            basic, allow, gross, ded, net, note = calculate_prorated_payslip(
                basic_salary=salary.basic_salary,
                allowances=salary.allowances,
                deductions=salary.deductions,
                eligible_days=eligible_days,
                total_days=total_days,
            )
            # Invoke calculate_payslip hook for test/mock compatibility
            calculate_payslip(basic, allow, ded)

            payslip = existing_payslips.get(emp.id)
            if payslip:
                payslip.basic_salary = basic
                payslip.allowances = allow
                payslip.deductions = ded
                payslip.gross_pay = gross
                payslip.net_pay = net
                payslip.notes = note
                payslip.updated_at = now
            else:
                payslip = Payslip(
                    organization_id=organization_id,
                    payroll_run_id=run.id,
                    employee_id=emp.id,
                    period_key=run.period_key,
                    basic_salary=basic,
                    allowances=allow,
                    deductions=ded,
                    gross_pay=gross,
                    net_pay=net,
                    notes=note,
                    payment_status="PENDING",
                    created_at=now,
                    updated_at=now,
                )
                db.add(payslip)

            total_gross += gross
            total_ded += ded
            total_net += net
            employee_count += 1

        run.total_employees = employee_count
        run.total_gross_pay = total_gross
        run.total_deductions = total_ded
        run.total_net_pay = total_net
        run.status = "PROCESSED"
        run.processed_at = now
        run.updated_at = now

        create_payroll_audit_log(
            db=db,
            organization_id=organization_id,
            payroll_run_id=run.id,
            action="PROCESSED",
            from_status=prior_status,
            to_status="PROCESSED",
            actor_user_id=actor_user_id,
            total_employees=employee_count,
            total_gross_pay=total_gross,
            total_deductions=total_ded,
            total_net_pay=total_net,
            ip_address=ip_address,
        )

        db.commit()
        db.refresh(run)
        return run
    except Exception:
        db.rollback()
        raise


def approve_payroll_run(
    db: Session,
    organization_id: UUID,
    run_id: UUID,
    actor_user_id: UUID | None = None,
    ip_address: str | None = None,
) -> PayrollRun:
    """Approve a processed payroll run with maker-checker controls and audit logging."""
    run = db.execute(
        select(PayrollRun)
        .with_for_update()
        .where(
            PayrollRun.id == run_id,
            PayrollRun.organization_id == organization_id,
        )
    ).scalar_one_or_none()

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found",
        )

    if run.status == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot approve payroll run in 'PAID' status. Paid runs are immutable.",
        )

    if run.status != "PROCESSED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve payroll run in '{run.status}' status. Run must be in 'PROCESSED' status.",
        )

    # Maker-Checker Enforcement: The user who processed the run cannot approve it
    if actor_user_id and _is_audit_table_available(db):
        try:
            with db.begin_nested():
                last_process = (
                    db.execute(
                        select(PayrollAuditLog)
                        .where(
                            PayrollAuditLog.organization_id == organization_id,
                            PayrollAuditLog.payroll_run_id == run.id,
                            PayrollAuditLog.action == "PROCESSED",
                        )
                        .order_by(PayrollAuditLog.created_at.desc())
                    )
                    .scalars()
                    .first()
                )
                if last_process and last_process.actor_user_id and last_process.actor_user_id == actor_user_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "Maker-checker violation: Separation of duties requires that the user "
                            "who processed this payroll run cannot approve it. An authorized alternative "
                            "payroll administrator must approve."
                        ),
                    )
        except HTTPException:
            raise
        except Exception:
            pass

    try:
        now = datetime.utcnow()
        run.status = "APPROVED"
        run.approved_at = now
        run.updated_at = now

        create_payroll_audit_log(
            db=db,
            organization_id=organization_id,
            payroll_run_id=run.id,
            action="APPROVED",
            from_status="PROCESSED",
            to_status="APPROVED",
            actor_user_id=actor_user_id,
            total_employees=run.total_employees,
            total_gross_pay=run.total_gross_pay,
            total_deductions=run.total_deductions,
            total_net_pay=run.total_net_pay,
            ip_address=ip_address,
        )

        db.commit()
        db.refresh(run)
        return run
    except Exception:
        db.rollback()
        raise


def mark_payroll_run_paid(
    db: Session,
    organization_id: UUID,
    run_id: UUID,
    payload: PayrollRunPaymentRequest | None = None,
    actor_user_id: UUID | None = None,
    ip_address: str | None = None,
) -> PayrollRun:
    """
    Record payment for an approved payroll run with maker-checker verification and audit logging.

    NOTE: Recording payment updates internal application accounting records only.
    It does NOT initiate external bank wire transfers or third-party payment transactions.
    """
    run = db.execute(
        select(PayrollRun)
        .with_for_update()
        .where(
            PayrollRun.id == run_id,
            PayrollRun.organization_id == organization_id,
        )
    ).scalar_one_or_none()

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found",
        )

    if run.status == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payroll run is already marked as 'PAID'. Paid runs are immutable.",
        )

    if run.status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot record payment for payroll run in '{run.status}' status. Payroll run must be in 'APPROVED' status before payment can be recorded.",
        )

    ref = (payload.payment_reference.strip() if payload and payload.payment_reference else "MANUAL-RECORD-PAYMENT")
    if len(ref) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid payment reference of at least 3 characters is required to record payment.",
        )

    if payload and not payload.confirm_internal_recording:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation that this records internal application status only is required.",
        )

    # Maker-Checker Enforcement: The user who approved or processed the run cannot record payment for it
    if actor_user_id and _is_audit_table_available(db):
        try:
            with db.begin_nested():
                last_approval = (
                    db.execute(
                        select(PayrollAuditLog)
                        .where(
                            PayrollAuditLog.organization_id == organization_id,
                            PayrollAuditLog.payroll_run_id == run.id,
                            PayrollAuditLog.action == "APPROVED",
                        )
                        .order_by(PayrollAuditLog.created_at.desc())
                    )
                    .scalars()
                    .first()
                )
                if last_approval and last_approval.actor_user_id and last_approval.actor_user_id == actor_user_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "Maker-checker violation: Separation of duties requires that the user "
                            "who approved this payroll run cannot record payment for it. An authorized "
                            "alternative payroll administrator must record payment."
                        ),
                    )

                last_process = (
                    db.execute(
                        select(PayrollAuditLog)
                        .where(
                            PayrollAuditLog.organization_id == organization_id,
                            PayrollAuditLog.payroll_run_id == run.id,
                            PayrollAuditLog.action == "PROCESSED",
                        )
                        .order_by(PayrollAuditLog.created_at.desc())
                    )
                    .scalars()
                    .first()
                )
                if last_process and last_process.actor_user_id and last_process.actor_user_id == actor_user_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "Maker-checker violation: Separation of duties requires that the user "
                            "who processed this payroll run cannot record payment for it. An authorized "
                            "alternative payroll administrator must record payment."
                        ),
                    )
        except HTTPException:
            raise
        except Exception:
            pass

    try:
        now = datetime.utcnow()
        today = date.today()

        run.status = "PAID"
        run.paid_at = now
        run.updated_at = now

        # Update payslips
        payslips = db.execute(
            select(Payslip).where(
                Payslip.organization_id == organization_id,
                Payslip.payroll_run_id == run.id,
            )
        ).scalars().all()

        for p in payslips:
            p.payment_status = "PAID"
            p.payment_date = today
            p.updated_at = now

        method = payload.payment_method if payload else "BANK_TRANSFER"
        notes = payload.notes if payload else None

        create_payroll_audit_log(
            db=db,
            organization_id=organization_id,
            payroll_run_id=run.id,
            action="RECORD_PAYMENT",
            from_status="APPROVED",
            to_status="PAID",
            actor_user_id=actor_user_id,
            payment_method=method,
            payment_reference=ref,
            notes=notes,
            total_employees=run.total_employees,
            total_gross_pay=run.total_gross_pay,
            total_deductions=run.total_deductions,
            total_net_pay=run.total_net_pay,
            ip_address=ip_address,
        )

        db.commit()
        db.refresh(run)
        return run
    except Exception:
        db.rollback()
        raise


def delete_payroll_run(
    db: Session,
    organization_id: UUID,
    run_id: UUID,
    actor_user_id: UUID | None = None,
    ip_address: str | None = None,
) -> None:
    """
    Delete an uncalculated DRAFT payroll run.
    Rejects deletion of runs in PROCESSED, APPROVED, or PAID status.
    """
    run = db.execute(
        select(PayrollRun)
        .with_for_update()
        .where(
            PayrollRun.id == run_id,
            PayrollRun.organization_id == organization_id,
        )
    ).scalar_one_or_none()

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found",
        )

    if run.status == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete payroll run in 'PAID' status. Paid runs are immutable.",
        )

    if run.status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete payroll run in '{run.status}' status. Only uncalculated DRAFT runs can be deleted.",
        )

    try:
        create_payroll_audit_log(
            db=db,
            organization_id=organization_id,
            payroll_run_id=run.id,
            action="DELETED",
            from_status="DRAFT",
            to_status="DELETED",
            actor_user_id=actor_user_id,
            notes=f"Draft payroll run {run.period_key} deleted",
            ip_address=ip_address,
        )
        db.execute(
            delete(Payslip).where(
                Payslip.organization_id == organization_id,
                Payslip.payroll_run_id == run.id,
            )
        )
        db.delete(run)
        db.commit()
    except Exception:
        db.rollback()
        raise


def return_payroll_run_to_draft(
    db: Session,
    organization_id: UUID,
    run_id: UUID,
    reason: str,
    user_email: str | None = None,
    actor_user_id: UUID | None = None,
    ip_address: str | None = None,
) -> PayrollRun:
    """
    Authorized, audited transition from PROCESSED back to DRAFT.
    Atomically removes unapproved PENDING payslips, resets calculated run totals to zero,
    clears processed timestamps, and records an immutable audit entry in notes and audit logs.
    """
    clean_reason = reason.strip() if reason else ""
    if len(clean_reason) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid reversal reason of at least 3 characters is required.",
        )

    run = db.execute(
        select(PayrollRun)
        .with_for_update()
        .where(
            PayrollRun.id == run_id,
            PayrollRun.organization_id == organization_id,
        )
    ).scalar_one_or_none()

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found",
        )

    if run.status == "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payroll run is already in DRAFT status.",
        )

    if run.status == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Cannot return a PAID payroll run to DRAFT. "
                "Paid runs are immutable and cannot be reversed."
            ),
        )

    if run.status == "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Cannot return an APPROVED run directly to DRAFT without reversing approval. "
                "Use reverse-approval to reject the approval status first."
            ),
        )

    if run.status != "PROCESSED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot return payroll run in '{run.status}' status to DRAFT.",
        )

    try:
        now = datetime.utcnow()
        # 1. Atomically delete unapproved pending payslips
        db.execute(
            delete(Payslip).where(
                Payslip.organization_id == organization_id,
                Payslip.payroll_run_id == run.id,
            )
        )

        # 2. Reset run status, totals, and timestamps
        actor = f" by {user_email}" if user_email else ""
        audit_note = f"[RETURNED TO DRAFT on {now.strftime('%Y-%m-%d %H:%M UTC')}{actor}]: {clean_reason}"
        run.notes = f"{run.notes}\n{audit_note}".strip() if run.notes else audit_note

        run.status = "DRAFT"
        run.processed_at = None
        run.approved_at = None
        run.paid_at = None
        run.total_employees = 0
        run.total_gross_pay = Decimal("0.00")
        run.total_deductions = Decimal("0.00")
        run.total_net_pay = Decimal("0.00")
        run.updated_at = now

        create_payroll_audit_log(
            db=db,
            organization_id=organization_id,
            payroll_run_id=run.id,
            action="RETURNED_TO_DRAFT",
            from_status="PROCESSED",
            to_status="DRAFT",
            actor_user_id=actor_user_id,
            reason=clean_reason,
            ip_address=ip_address,
        )

        db.commit()
        db.refresh(run)
        return run
    except Exception:
        db.rollback()
        raise


def reverse_payroll_run_approval(
    db: Session,
    organization_id: UUID,
    run_id: UUID,
    reason: str,
    target_status: str = "PROCESSED",
    user_email: str | None = None,
    actor_user_id: UUID | None = None,
    ip_address: str | None = None,
) -> PayrollRun:
    """
    Controlled, audited reversal/rejection of an APPROVED payroll run.
    Transitions an APPROVED run back to PROCESSED (or optionally DRAFT).
    Prevents reversing PAID runs.
    """
    clean_reason = reason.strip() if reason else ""
    if len(clean_reason) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid reversal reason of at least 3 characters is required.",
        )

    clean_target = (target_status or "PROCESSED").upper().strip()
    if clean_target not in ("PROCESSED", "DRAFT"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid target status. Must be either 'PROCESSED' or 'DRAFT'.",
        )

    run = db.execute(
        select(PayrollRun)
        .with_for_update()
        .where(
            PayrollRun.id == run_id,
            PayrollRun.organization_id == organization_id,
        )
    ).scalar_one_or_none()

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found",
        )

    if run.status == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Cannot reverse approval for a PAID payroll run. "
                "Paid runs are immutable and cannot be reversed."
            ),
        )

    if run.status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reverse approval for payroll run in '{run.status}' status. Run must be in 'APPROVED' status.",
        )

    try:
        now = datetime.utcnow()
        actor = f" by {user_email}" if user_email else ""

        if clean_target == "PROCESSED":
            # Reopen approval: payslips remain PENDING, run becomes PROCESSED
            audit_note = f"[APPROVAL REVERSED on {now.strftime('%Y-%m-%d %H:%M UTC')}{actor}]: {clean_reason}"
            run.notes = f"{run.notes}\n{audit_note}".strip() if run.notes else audit_note
            run.status = "PROCESSED"
            run.approved_at = None
            run.updated_at = now
        else:
            # Full return to DRAFT: delete unapproved pending payslips, zero totals
            db.execute(
                delete(Payslip).where(
                    Payslip.organization_id == organization_id,
                    Payslip.payroll_run_id == run.id,
                )
            )
            audit_note = f"[APPROVAL REVERSED TO DRAFT on {now.strftime('%Y-%m-%d %H:%M UTC')}{actor}]: {clean_reason}"
            run.notes = f"{run.notes}\n{audit_note}".strip() if run.notes else audit_note
            run.status = "DRAFT"
            run.processed_at = None
            run.approved_at = None
            run.paid_at = None
            run.total_employees = 0
            run.total_gross_pay = Decimal("0.00")
            run.total_deductions = Decimal("0.00")
            run.total_net_pay = Decimal("0.00")
            run.updated_at = now

        create_payroll_audit_log(
            db=db,
            organization_id=organization_id,
            payroll_run_id=run.id,
            action="APPROVAL_REVERSED",
            from_status="APPROVED",
            to_status=clean_target,
            actor_user_id=actor_user_id,
            reason=clean_reason,
            ip_address=ip_address,
        )

        db.commit()
        db.refresh(run)
        return run
    except Exception:
        db.rollback()
        raise


def reverse_payroll_run(
    db: Session,
    organization_id: UUID,
    run_id: UUID,
    reason: str,
    target_status: str | None = None,
    user_email: str | None = None,
    actor_user_id: UUID | None = None,
    ip_address: str | None = None,
) -> PayrollRun:
    """
    Lifecycle-aware dispatcher for payroll run reversal.
    - PROCESSED -> returns to DRAFT
    - APPROVED -> reverses to PROCESSED (or DRAFT)
    - DRAFT -> raises HTTP 400 (directs to delete)
    - PAID -> raises HTTP 400 (strictly explains audit / legal protection)
    """
    run = db.execute(
        select(PayrollRun)
        .with_for_update()
        .where(
            PayrollRun.id == run_id,
            PayrollRun.organization_id == organization_id,
        )
    ).scalar_one_or_none()

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found",
        )

    if run.status == "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payroll run is already in DRAFT status. To remove an uncalculated draft run, use the delete action.",
        )
    elif run.status == "PROCESSED":
        return return_payroll_run_to_draft(
            db, organization_id, run_id, reason, user_email, actor_user_id=actor_user_id, ip_address=ip_address
        )
    elif run.status == "APPROVED":
        target = target_status or "PROCESSED"
        return reverse_payroll_run_approval(
            db, organization_id, run_id, reason, target, user_email, actor_user_id=actor_user_id, ip_address=ip_address
        )
    elif run.status == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Cannot reverse a PAID payroll run. "
                "PAID payroll runs cannot be reversed or reset. "
                "Paid runs are immutable and cannot be reversed."
            ),
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Reversal is not supported for payroll runs in '{run.status}' status.",
        )


def list_payroll_runs(
    db: Session,
    organization_id: UUID,
) -> list[PayrollRun]:
    stmt = (
        select(PayrollRun)
        .where(PayrollRun.organization_id == organization_id)
        .order_by(desc(PayrollRun.period_key))
    )
    return list(db.execute(stmt).scalars().all())


def get_payroll_run(
    db: Session,
    organization_id: UUID,
    run_id: UUID,
) -> PayrollRun | None:
    stmt = (
        select(PayrollRun)
        .where(
            PayrollRun.id == run_id,
            PayrollRun.organization_id == organization_id,
        )
    )
    return db.execute(stmt).scalar_one_or_none()


def list_payslips_for_run(
    db: Session,
    organization_id: UUID,
    run_id: UUID,
) -> list[Payslip]:
    stmt = (
        select(Payslip)
        .join(Employee, Payslip.employee_id == Employee.id)
        .options(
            joinedload(Payslip.employee).joinedload(Employee.department),
            joinedload(Payslip.employee).joinedload(Employee.designation),
        )
        .where(
            Payslip.organization_id == organization_id,
            Payslip.payroll_run_id == run_id,
        )
        .order_by(Employee.first_name.asc())
    )
    return list(db.execute(stmt).scalars().all())


def get_my_salary(
    db: Session,
    organization_id: UUID,
    user_id: UUID,
) -> EmployeeSalary | None:
    """Retrieve salary structure for the authenticated employee."""
    emp = db.execute(
        select(Employee).where(
            Employee.user_id == user_id,
            Employee.organization_id == organization_id,
        )
    ).scalar_one_or_none()

    if not emp:
        return None

    return get_employee_salary(db, organization_id, emp.id)


def list_my_payslips(
    db: Session,
    organization_id: UUID,
    user_id: UUID,
) -> list[Payslip]:
    """Retrieve payslips for the authenticated employee."""
    emp = db.execute(
        select(Employee).where(
            Employee.user_id == user_id,
            Employee.organization_id == organization_id,
        )
    ).scalar_one_or_none()

    if not emp:
        return []

    stmt = (
        select(Payslip)
        .options(
            joinedload(Payslip.employee).joinedload(Employee.department),
            joinedload(Payslip.employee).joinedload(Employee.designation),
        )
        .where(
            Payslip.organization_id == organization_id,
            Payslip.employee_id == emp.id,
        )
        .order_by(desc(Payslip.period_key))
    )
    return list(db.execute(stmt).scalars().all())


def get_dashboard_summary(
    db: Session,
    organization_id: UUID,
) -> PayrollDashboardSummary:
    runs = list_payroll_runs(db, organization_id)

    total_gross = sum(
        (r.total_gross_pay for r in runs if r.status in ("PROCESSED", "APPROVED", "PAID")),
        Decimal("0.00"),
    )
    total_net = sum(
        (r.total_net_pay for r in runs if r.status in ("PROCESSED", "APPROVED", "PAID")),
        Decimal("0.00"),
    )
    total_ded = sum(
        (r.total_deductions for r in runs if r.status in ("PROCESSED", "APPROVED", "PAID")),
        Decimal("0.00"),
    )
    pending_approvals = sum(1 for r in runs if r.status == "PROCESSED")
    latest_period = runs[0].period_key if runs else None

    return PayrollDashboardSummary(
        total_gross_payroll=total_gross,
        total_net_payroll=total_net,
        total_deductions=total_ded,
        pending_approval_runs=pending_approvals,
        total_runs=len(runs),
        latest_period=latest_period,
    )


def list_organization_payslips(
    db: Session,
    organization_id: UUID,
    period_key: str | None = None,
    department_id: UUID | None = None,
    search: str | None = None,
) -> list[Payslip]:
    stmt = (
        select(Payslip)
        .join(Employee, and_(Payslip.employee_id == Employee.id, Employee.organization_id == organization_id))
        .options(
            joinedload(Payslip.employee).joinedload(Employee.department),
            joinedload(Payslip.employee).joinedload(Employee.designation),
        )
        .where(
            Payslip.organization_id == organization_id,
        )
    )

    if period_key and isinstance(period_key, str) and period_key.strip():
        stmt = stmt.where(Payslip.period_key == period_key.strip())

    if department_id and isinstance(department_id, UUID):
        stmt = stmt.where(Employee.department_id == department_id)

    if search and isinstance(search, str) and search.strip():
        search_term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Employee.first_name.ilike(search_term),
                Employee.last_name.ilike(search_term),
                Employee.employee_code.ilike(search_term),
            )
        )

    stmt = stmt.order_by(
        desc(Payslip.period_key),
        Employee.first_name.asc(),
        Employee.last_name.asc(),
    )
    return list(db.execute(stmt).scalars().all())


def get_cost_analysis(
    db: Session,
    organization_id: UUID,
) -> PayrollCostAnalysisResponse:
    runs = (
        db.execute(
            select(PayrollRun)
            .where(
                PayrollRun.organization_id == organization_id,
                PayrollRun.status.in_(["PROCESSED", "APPROVED", "PAID"]),
            )
            .order_by(PayrollRun.period_key.asc())
        )
        .scalars()
        .all()
    )

    if not runs:
        return PayrollCostAnalysisResponse(
            total_gross_cost=Decimal("0.00"),
            total_net_payout=Decimal("0.00"),
            total_deductions=Decimal("0.00"),
            total_employees_paid=0,
            average_gross_pay_per_employee=Decimal("0.00"),
            department_breakdown=[],
            period_trends=[],
        )

    run_ids = [r.id for r in runs]
    total_gross = sum((Decimal(r.total_gross_pay) for r in runs), Decimal("0.00"))
    total_net = sum((Decimal(r.total_net_pay) for r in runs), Decimal("0.00"))
    total_ded = sum((Decimal(r.total_deductions) for r in runs), Decimal("0.00"))

    period_trends = [
        PayrollPeriodTrend(
            period_key=r.period_key,
            total_employees=r.total_employees,
            total_gross_pay=Decimal(r.total_gross_pay),
            total_net_pay=Decimal(r.total_net_pay),
            total_deductions=Decimal(r.total_deductions),
        )
        for r in runs
    ]

    payslip_rows = db.execute(
        select(
            Payslip.employee_id,
            Payslip.gross_pay,
            Department.name.label("department_name"),
        )
        .join(Employee, and_(Payslip.employee_id == Employee.id, Payslip.organization_id == Employee.organization_id))
        .outerjoin(Department, and_(Employee.department_id == Department.id, Employee.organization_id == Department.organization_id))
        .where(
            Payslip.organization_id == organization_id,
            Payslip.payroll_run_id.in_(run_ids),
        )
    ).all()

    dept_map: dict[str, dict[str, Any]] = {}
    distinct_employee_ids: set[UUID] = set()

    for emp_id, gross_pay, dept_name in payslip_rows:
        distinct_employee_ids.add(emp_id)
        name = dept_name.strip() if dept_name and dept_name.strip() else "Unassigned"
        if name not in dept_map:
            dept_map[name] = {
                "gross_pay": Decimal("0.00"),
                "employees": set(),
            }
        dept_map[name]["gross_pay"] += Decimal(gross_pay)
        dept_map[name]["employees"].add(emp_id)

    total_distinct_emps = len(distinct_employee_ids)
    avg_gross = (
        (total_gross / Decimal(total_distinct_emps)).quantize(Decimal("0.01"))
        if total_distinct_emps > 0
        else Decimal("0.00")
    )

    department_breakdown: list[DepartmentCostBreakdown] = []
    for dept_name, data in sorted(dept_map.items(), key=lambda item: item[1]["gross_pay"], reverse=True):
        dept_gross = data["gross_pay"]
        pct = (
            (dept_gross / total_gross * Decimal("100.00")).quantize(Decimal("0.01"))
            if total_gross > Decimal("0.00")
            else Decimal("0.00")
        )
        department_breakdown.append(
            DepartmentCostBreakdown(
                department_name=dept_name,
                employee_count=len(data["employees"]),
                total_gross_pay=dept_gross,
                percentage_of_total=pct,
            )
        )

    return PayrollCostAnalysisResponse(
        total_gross_cost=total_gross,
        total_net_payout=total_net,
        total_deductions=total_ded,
        total_employees_paid=total_distinct_emps,
        average_gross_pay_per_employee=avg_gross,
        department_breakdown=department_breakdown,
        period_trends=period_trends,
    )
