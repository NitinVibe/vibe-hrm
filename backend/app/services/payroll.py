from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.employee import Employee
from app.models.payroll import EmployeeSalary, PayrollRun, Payslip
from app.schemas.payroll import (
    EmployeeSalaryCreateOrUpdate,
    PayrollDashboardSummary,
    PayrollRunCreate,
)


def calculate_payslip(
    basic_salary: Decimal,
    allowances: Decimal,
    deductions: Decimal,
) -> tuple[Decimal, Decimal]:
    """Pure, deterministic calculation for gross and net pay."""
    gross = Decimal(basic_salary) + Decimal(allowances)
    net = max(Decimal("0.00"), gross - Decimal(deductions))
    return gross, net


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

    # Check for existing salary structure
    stmt = select(EmployeeSalary).where(
        EmployeeSalary.employee_id == payload.employee_id,
        EmployeeSalary.organization_id == organization_id,
    )
    salary = db.execute(stmt).scalar_one_or_none()

    now = datetime.utcnow()
    effective = payload.effective_from or date.today()

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


def create_payroll_run(
    db: Session,
    organization_id: UUID,
    payload: PayrollRunCreate,
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
    db.commit()
    db.refresh(run)
    return run


def process_payroll_run(
    db: Session,
    organization_id: UUID,
    run_id: UUID,
) -> PayrollRun:
    """
    Calculate and generate payslips for all eligible active employees with active salary structures.
    """
    run = db.execute(
        select(PayrollRun).where(
            PayrollRun.id == run_id,
            PayrollRun.organization_id == organization_id,
        )
    ).scalar_one_or_none()

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found",
        )

    if run.status in ("APPROVED", "PAID"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot re-process payroll run in {run.status} status",
        )

    # Fetch all active employees with active salary structures
    stmt = (
        select(Employee, EmployeeSalary)
        .join(EmployeeSalary, Employee.id == EmployeeSalary.employee_id)
        .where(
            Employee.organization_id == organization_id,
            Employee.employment_status == "ACTIVE",
            EmployeeSalary.organization_id == organization_id,
            EmployeeSalary.is_active.is_(True),
        )
    )
    records = db.execute(stmt).all()

    now = datetime.utcnow()
    total_gross = Decimal("0.00")
    total_ded = Decimal("0.00")
    total_net = Decimal("0.00")
    employee_count = 0

    for emp, salary in records:
        gross, net = calculate_payslip(
            salary.basic_salary,
            salary.allowances,
            salary.deductions,
        )

        # Check if payslip already exists for this run and employee
        ps_stmt = select(Payslip).where(
            Payslip.organization_id == organization_id,
            Payslip.payroll_run_id == run.id,
            Payslip.employee_id == emp.id,
        )
        payslip = db.execute(ps_stmt).scalar_one_or_none()

        if payslip:
            payslip.basic_salary = salary.basic_salary
            payslip.allowances = salary.allowances
            payslip.deductions = salary.deductions
            payslip.gross_pay = gross
            payslip.net_pay = net
            payslip.updated_at = now
        else:
            payslip = Payslip(
                organization_id=organization_id,
                payroll_run_id=run.id,
                employee_id=emp.id,
                period_key=run.period_key,
                basic_salary=salary.basic_salary,
                allowances=salary.allowances,
                deductions=salary.deductions,
                gross_pay=gross,
                net_pay=net,
                payment_status="PENDING",
                created_at=now,
                updated_at=now,
            )
            db.add(payslip)

        total_gross += gross
        total_ded += salary.deductions
        total_net += net
        employee_count += 1

    run.total_employees = employee_count
    run.total_gross_pay = total_gross
    run.total_deductions = total_ded
    run.total_net_pay = total_net
    run.status = "PROCESSED"
    run.processed_at = now
    run.updated_at = now

    db.commit()
    db.refresh(run)
    return run


def approve_payroll_run(
    db: Session,
    organization_id: UUID,
    run_id: UUID,
) -> PayrollRun:
    """Approve a processed payroll run."""
    run = db.execute(
        select(PayrollRun).where(
            PayrollRun.id == run_id,
            PayrollRun.organization_id == organization_id,
        )
    ).scalar_one_or_none()

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found",
        )

    if run.status != "PROCESSED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve payroll run in {run.status} status. It must be PROCESSED first.",
        )

    now = datetime.utcnow()
    run.status = "APPROVED"
    run.approved_at = now
    run.updated_at = now

    db.commit()
    db.refresh(run)
    return run


def mark_payroll_run_paid(
    db: Session,
    organization_id: UUID,
    run_id: UUID,
) -> PayrollRun:
    """Mark an approved or processed payroll run and its payslips as PAID."""
    run = db.execute(
        select(PayrollRun).where(
            PayrollRun.id == run_id,
            PayrollRun.organization_id == organization_id,
        )
    ).scalar_one_or_none()

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found",
        )

    if run.status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot pay payroll run in '{run.status}' status. Payroll run must be in 'APPROVED' status before payment can be issued.",
        )

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

    db.commit()
    db.refresh(run)
    return run


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
