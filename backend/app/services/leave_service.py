from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import and_, inspect, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.employee import Employee
from app.models.leave_balance import LeaveBalance
from app.models.leave_policy import LeavePolicy
from app.models.leave_request import LeaveRequest
from app.models.leave_type import LeaveType
from app.models.user import User
from app.schemas.leave_balance import LeaveBalanceCreate, LeaveBalanceResponse
from app.schemas.leave_policy import LeavePolicyCreate, LeavePolicyUpdate
from app.schemas.leave_request import (
    LeaveRequestAction,
    LeaveRequestCreate,
    LeaveRequestResponse,
)
from app.schemas.leave_type import LeaveTypeCreate, LeaveTypeUpdate


def _is_table_available(db: Session, table_name: str) -> bool:
    """Safely check table availability without aborting the active transaction."""
    try:
        conn = db.connection()
        return inspect(conn).has_table(table_name)
    except Exception:
        return False


def calculate_leave_days(start_date: date, end_date: date) -> Decimal:
    """Calculate the inclusive calendar days of leave."""
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be before or equal to end_date",
        )
    days = (end_date - start_date).days + 1
    return Decimal(str(days))


# -------------------------------------------------------------
# 1. Leave Types Service
# -------------------------------------------------------------

def list_leave_types(
    db: Session,
    organization_id: UUID,
    active_only: bool = False,
) -> list[LeaveType]:
    """Retrieve all leave types for an organization."""
    if not _is_table_available(db, "leave_types"):
        return []

    stmt = select(LeaveType).where(LeaveType.organization_id == organization_id)
    if active_only:
        stmt = stmt.where(LeaveType.is_active == True)  # noqa: E712
    stmt = stmt.order_by(LeaveType.name.asc())
    return list(db.execute(stmt).scalars().all())


def get_leave_type(
    db: Session,
    organization_id: UUID,
    leave_type_id: UUID,
) -> LeaveType | None:
    """Get a single leave type by ID."""
    if not _is_table_available(db, "leave_types"):
        return None

    return db.execute(
        select(LeaveType).where(
            LeaveType.id == leave_type_id,
            LeaveType.organization_id == organization_id,
        )
    ).scalar_one_or_none()


def create_leave_type(
    db: Session,
    organization_id: UUID,
    payload: LeaveTypeCreate,
) -> LeaveType:
    """Create a new leave type ensuring code and name uniqueness within organization."""
    if not _is_table_available(db, "leave_types"):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Leave module database tables not yet migrated")

    # Check duplicate code or name
    existing = db.execute(
        select(LeaveType).where(
            LeaveType.organization_id == organization_id,
            or_(
                LeaveType.code == payload.code.strip().upper(),
                LeaveType.name == payload.name.strip(),
            ),
        )
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Leave type with code '{payload.code}' or name '{payload.name}' already exists in your organization",
        )

    leave_type = LeaveType(
        id=uuid4(),
        organization_id=organization_id,
        name=payload.name.strip(),
        code=payload.code.strip().upper(),
        description=payload.description.strip() if payload.description else None,
        is_paid=payload.is_paid,
        default_days_per_year=payload.default_days_per_year,
        is_active=payload.is_active,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(leave_type)
    db.commit()
    db.refresh(leave_type)
    return leave_type


def update_leave_type(
    db: Session,
    organization_id: UUID,
    leave_type_id: UUID,
    payload: LeaveTypeUpdate,
) -> LeaveType:
    """Update an existing leave type."""
    leave_type = get_leave_type(db, organization_id, leave_type_id)
    if not leave_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave type not found")

    if payload.code is not None:
        new_code = payload.code.strip().upper()
        conflict = db.execute(
            select(LeaveType).where(
                LeaveType.organization_id == organization_id,
                LeaveType.code == new_code,
                LeaveType.id != leave_type_id,
            )
        ).scalar_one_or_none()
        if conflict:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Leave type code '{new_code}' already in use")
        leave_type.code = new_code

    if payload.name is not None:
        new_name = payload.name.strip()
        conflict = db.execute(
            select(LeaveType).where(
                LeaveType.organization_id == organization_id,
                LeaveType.name == new_name,
                LeaveType.id != leave_type_id,
            )
        ).scalar_one_or_none()
        if conflict:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Leave type name '{new_name}' already in use")
        leave_type.name = new_name

    if payload.description is not None:
        leave_type.description = payload.description.strip() if payload.description else None
    if payload.is_paid is not None:
        leave_type.is_paid = payload.is_paid
    if payload.default_days_per_year is not None:
        leave_type.default_days_per_year = payload.default_days_per_year
    if payload.is_active is not None:
        leave_type.is_active = payload.is_active

    leave_type.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(leave_type)
    return leave_type


# -------------------------------------------------------------
# 2. Leave Policies Service
# -------------------------------------------------------------

def list_leave_policies(
    db: Session,
    organization_id: UUID,
) -> list[LeavePolicy]:
    """Retrieve all leave policies for an organization."""
    if not _is_table_available(db, "leave_policies"):
        return []

    stmt = (
        select(LeavePolicy)
        .options(joinedload(LeavePolicy.leave_type))
        .where(LeavePolicy.organization_id == organization_id)
        .order_by(LeavePolicy.name.asc())
    )
    return list(db.execute(stmt).scalars().all())


def create_or_update_leave_policy(
    db: Session,
    organization_id: UUID,
    payload: LeavePolicyCreate,
) -> LeavePolicy:
    """Create or update organization leave policy for a leave type."""
    if not _is_table_available(db, "leave_policies"):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Leave module database tables not yet migrated")

    leave_type = get_leave_type(db, organization_id, payload.leave_type_id)
    if not leave_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave type not found")

    policy = db.execute(
        select(LeavePolicy).where(
            LeavePolicy.organization_id == organization_id,
            LeavePolicy.leave_type_id == payload.leave_type_id,
        )
    ).scalar_one_or_none()

    now = datetime.utcnow()
    if policy:
        policy.name = payload.name.strip()
        policy.description = payload.description.strip() if payload.description else None
        policy.days_allowed = payload.days_allowed
        policy.carry_forward_days = payload.carry_forward_days
        policy.max_consecutive_days = payload.max_consecutive_days
        policy.requires_approval = payload.requires_approval
        policy.is_active = payload.is_active
        policy.updated_at = now
    else:
        policy = LeavePolicy(
            id=uuid4(),
            organization_id=organization_id,
            leave_type_id=payload.leave_type_id,
            name=payload.name.strip(),
            description=payload.description.strip() if payload.description else None,
            days_allowed=payload.days_allowed,
            carry_forward_days=payload.carry_forward_days,
            max_consecutive_days=payload.max_consecutive_days,
            requires_approval=payload.requires_approval,
            is_active=payload.is_active,
            created_at=now,
            updated_at=now,
        )
        db.add(policy)

    db.commit()
    db.refresh(policy)
    return policy


# -------------------------------------------------------------
# 3. Leave Balances Service
# -------------------------------------------------------------

def get_or_create_balance(
    db: Session,
    organization_id: UUID,
    employee_id: UUID,
    leave_type_id: UUID,
    year: int,
) -> LeaveBalance:
    """Fetch employee balance for a leave type and year, initializing from default days if absent."""
    balance = db.execute(
        select(LeaveBalance)
        .with_for_update()
        .where(
            LeaveBalance.organization_id == organization_id,
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.leave_type_id == leave_type_id,
            LeaveBalance.year == year,
        )
    ).scalar_one_or_none()

    if not balance:
        leave_type = db.execute(
            select(LeaveType).where(
                LeaveType.id == leave_type_id,
                LeaveType.organization_id == organization_id,
            )
        ).scalar_one_or_none()

        default_days = leave_type.default_days_per_year if leave_type else Decimal("12.00")

        now = datetime.utcnow()
        balance = LeaveBalance(
            id=uuid4(),
            organization_id=organization_id,
            employee_id=employee_id,
            leave_type_id=leave_type_id,
            year=year,
            total_days=default_days,
            used_days=Decimal("0.00"),
            pending_days=Decimal("0.00"),
            created_at=now,
            updated_at=now,
        )
        db.add(balance)
        db.flush()

    return balance


def list_leave_balances(
    db: Session,
    organization_id: UUID,
    employee_id: UUID | None = None,
    year: int | None = None,
) -> list[LeaveBalanceResponse]:
    """List leave balances with attached employee and leave type details."""
    if not _is_table_available(db, "leave_balances"):
        return []

    target_year = year or date.today().year
    stmt = (
        select(LeaveBalance, LeaveType, Employee)
        .join(LeaveType, LeaveBalance.leave_type_id == LeaveType.id)
        .join(Employee, LeaveBalance.employee_id == Employee.id)
        .where(
            LeaveBalance.organization_id == organization_id,
            LeaveBalance.year == target_year,
        )
    )

    if employee_id:
        stmt = stmt.where(LeaveBalance.employee_id == employee_id)

    stmt = stmt.order_by(Employee.first_name.asc(), LeaveType.name.asc())
    results = db.execute(stmt).all()

    output = []
    for bal, lt, emp in results:
        output.append(
            LeaveBalanceResponse(
                id=bal.id,
                organization_id=bal.organization_id,
                employee_id=bal.employee_id,
                leave_type_id=bal.leave_type_id,
                year=bal.year,
                total_days=bal.total_days,
                used_days=bal.used_days,
                pending_days=bal.pending_days,
                available_days=bal.available_days,
                leave_type_name=lt.name,
                leave_type_code=lt.code,
                employee_name=f"{emp.first_name} {emp.last_name}".strip(),
                employee_code=emp.employee_code,
                created_at=bal.created_at,
                updated_at=bal.updated_at,
            )
        )
    return output


def allocate_leave_balance(
    db: Session,
    organization_id: UUID,
    payload: LeaveBalanceCreate,
) -> LeaveBalanceResponse:
    """Manually allocate or set total leave days for an employee."""
    balance = get_or_create_balance(
        db=db,
        organization_id=organization_id,
        employee_id=payload.employee_id,
        leave_type_id=payload.leave_type_id,
        year=payload.year,
    )
    balance.total_days = payload.total_days
    balance.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(balance)

    lt = db.get(LeaveType, balance.leave_type_id)
    emp = db.get(Employee, balance.employee_id)

    return LeaveBalanceResponse(
        id=balance.id,
        organization_id=balance.organization_id,
        employee_id=balance.employee_id,
        leave_type_id=balance.leave_type_id,
        year=balance.year,
        total_days=balance.total_days,
        used_days=balance.used_days,
        pending_days=balance.pending_days,
        available_days=balance.available_days,
        leave_type_name=lt.name if lt else None,
        leave_type_code=lt.code if lt else None,
        employee_name=f"{emp.first_name} {emp.last_name}".strip() if emp else None,
        employee_code=emp.employee_code if emp else None,
        created_at=balance.created_at,
        updated_at=balance.updated_at,
    )


# -------------------------------------------------------------
# 4. Leave Requests & Lifecycle State Machine
# -------------------------------------------------------------

def apply_for_leave(
    db: Session,
    organization_id: UUID,
    employee_id: UUID,
    payload: LeaveRequestCreate,
) -> LeaveRequestResponse:
    """
    Submit a new leave request.
    Validates date order, detects overlapping active leave requests,
    checks leave balance availability, and holds pending_days.
    """
    if not _is_table_available(db, "leave_requests"):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Leave module database tables not yet migrated")

    total_days = calculate_leave_days(payload.start_date, payload.end_date)

    leave_type = get_leave_type(db, organization_id, payload.leave_type_id)
    if not leave_type or not leave_type.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active leave type not found")

    # 1. Overlapping Leave Request Validation
    overlap = db.execute(
        select(LeaveRequest).where(
            LeaveRequest.organization_id == organization_id,
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.status.in_(["PENDING", "APPROVED"]),
            LeaveRequest.start_date <= payload.end_date,
            LeaveRequest.end_date >= payload.start_date,
        )
    ).scalar_one_or_none()

    if overlap:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Overlapping leave request detected: An active request already exists for "
                f"{overlap.start_date} to {overlap.end_date} (Status: {overlap.status})."
            ),
        )

    # 2. Check and Hold Balance
    year = payload.start_date.year
    balance = get_or_create_balance(db, organization_id, employee_id, payload.leave_type_id, year)

    if leave_type.is_paid:
        if balance.available_days < total_days:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient leave balance for {leave_type.name}. "
                    f"Available: {balance.available_days} day(s), requested: {total_days} day(s)."
                ),
            )
        # Hold balance in pending
        balance.pending_days += total_days
        balance.updated_at = datetime.utcnow()

    # 3. Create Leave Request
    now = datetime.utcnow()
    leave_req = LeaveRequest(
        id=uuid4(),
        organization_id=organization_id,
        employee_id=employee_id,
        leave_type_id=payload.leave_type_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        total_days=total_days,
        reason=payload.reason.strip(),
        status="PENDING",
        created_at=now,
        updated_at=now,
    )
    db.add(leave_req)
    db.commit()
    db.refresh(leave_req)

    emp = db.get(Employee, employee_id)

    return LeaveRequestResponse(
        id=leave_req.id,
        organization_id=leave_req.organization_id,
        employee_id=leave_req.employee_id,
        leave_type_id=leave_req.leave_type_id,
        start_date=leave_req.start_date,
        end_date=leave_req.end_date,
        total_days=leave_req.total_days,
        reason=leave_req.reason,
        status=leave_req.status,
        approver_id=None,
        action_reason=None,
        action_at=None,
        leave_type_name=leave_type.name,
        leave_type_code=leave_type.code,
        employee_name=f"{emp.first_name} {emp.last_name}".strip() if emp else None,
        employee_code=emp.employee_code if emp else None,
        approver_name=None,
        created_at=leave_req.created_at,
        updated_at=leave_req.updated_at,
    )


def process_leave_request_action(
    db: Session,
    organization_id: UUID,
    request_id: UUID,
    approver_user_id: UUID,
    action: str,  # 'APPROVE' or 'REJECT'
    action_reason: str | None = None,
) -> LeaveRequestResponse:
    """
    Approve or reject a pending leave request atomically.
    Adjusts balances:
    - APPROVE: pending_days -> used_days
    - REJECT: pending_days -> released
    """
    leave_req = db.execute(
        select(LeaveRequest)
        .with_for_update()
        .where(
            LeaveRequest.id == request_id,
            LeaveRequest.organization_id == organization_id,
        )
    ).scalar_one_or_none()

    if not leave_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

    if leave_req.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot process leave request in '{leave_req.status}' status. Only PENDING requests can be actioned.",
        )

    # Fetch corresponding balance with row lock
    year = leave_req.start_date.year
    balance = db.execute(
        select(LeaveBalance)
        .with_for_update()
        .where(
            LeaveBalance.organization_id == organization_id,
            LeaveBalance.employee_id == leave_req.employee_id,
            LeaveBalance.leave_type_id == leave_req.leave_type_id,
            LeaveBalance.year == year,
        )
    ).scalar_one_or_none()

    now = datetime.utcnow()

    if action == "APPROVE":
        if balance:
            balance.pending_days = max(Decimal("0.00"), Decimal(balance.pending_days) - Decimal(leave_req.total_days))
            balance.used_days = Decimal(balance.used_days) + Decimal(leave_req.total_days)
            balance.updated_at = now

        leave_req.status = "APPROVED"
        leave_req.approver_id = approver_user_id
        leave_req.action_reason = action_reason.strip() if action_reason else None
        leave_req.action_at = now
        leave_req.updated_at = now

    elif action == "REJECT":
        if balance:
            balance.pending_days = max(Decimal("0.00"), Decimal(balance.pending_days) - Decimal(leave_req.total_days))
            balance.updated_at = now

        leave_req.status = "REJECTED"
        leave_req.approver_id = approver_user_id
        leave_req.action_reason = action_reason.strip() if action_reason else None
        leave_req.action_at = now
        leave_req.updated_at = now
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported leave action: {action}")

    db.commit()
    db.refresh(leave_req)

    lt = db.get(LeaveType, leave_req.leave_type_id)
    emp = db.get(Employee, leave_req.employee_id)
    approver = db.get(User, approver_user_id)

    return LeaveRequestResponse(
        id=leave_req.id,
        organization_id=leave_req.organization_id,
        employee_id=leave_req.employee_id,
        leave_type_id=leave_req.leave_type_id,
        start_date=leave_req.start_date,
        end_date=leave_req.end_date,
        total_days=leave_req.total_days,
        reason=leave_req.reason,
        status=leave_req.status,
        approver_id=leave_req.approver_id,
        action_reason=leave_req.action_reason,
        action_at=leave_req.action_at,
        leave_type_name=lt.name if lt else None,
        leave_type_code=lt.code if lt else None,
        employee_name=f"{emp.first_name} {emp.last_name}".strip() if emp else None,
        employee_code=emp.employee_code if emp else None,
        approver_name=approver.email if approver else None,
        created_at=leave_req.created_at,
        updated_at=leave_req.updated_at,
    )


def cancel_leave_request(
    db: Session,
    organization_id: UUID,
    request_id: UUID,
    employee_id: UUID | None = None,
) -> LeaveRequestResponse:
    """
    Cancel a leave request.
    Releases held pending_days or refunds used_days if cancelling an approved future leave.
    """
    stmt = (
        select(LeaveRequest)
        .with_for_update()
        .where(
            LeaveRequest.id == request_id,
            LeaveRequest.organization_id == organization_id,
        )
    )
    if employee_id:
        stmt = stmt.where(LeaveRequest.employee_id == employee_id)

    leave_req = db.execute(stmt).scalar_one_or_none()
    if not leave_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

    if leave_req.status not in ("PENDING", "APPROVED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel leave request in '{leave_req.status}' status.",
        )

    year = leave_req.start_date.year
    balance = db.execute(
        select(LeaveBalance)
        .with_for_update()
        .where(
            LeaveBalance.organization_id == organization_id,
            LeaveBalance.employee_id == leave_req.employee_id,
            LeaveBalance.leave_type_id == leave_req.leave_type_id,
            LeaveBalance.year == year,
        )
    ).scalar_one_or_none()

    now = datetime.utcnow()
    if leave_req.status == "PENDING":
        if balance:
            balance.pending_days = max(Decimal("0.00"), Decimal(balance.pending_days) - Decimal(leave_req.total_days))
            balance.updated_at = now
    elif leave_req.status == "APPROVED":
        if leave_req.start_date < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel approved leave that has already started.",
            )
        if balance:
            balance.used_days = max(Decimal("0.00"), Decimal(balance.used_days) - Decimal(leave_req.total_days))
            balance.updated_at = now

    leave_req.status = "CANCELLED"
    leave_req.updated_at = now
    db.commit()
    db.refresh(leave_req)

    lt = db.get(LeaveType, leave_req.leave_type_id)
    emp = db.get(Employee, leave_req.employee_id)

    return LeaveRequestResponse(
        id=leave_req.id,
        organization_id=leave_req.organization_id,
        employee_id=leave_req.employee_id,
        leave_type_id=leave_req.leave_type_id,
        start_date=leave_req.start_date,
        end_date=leave_req.end_date,
        total_days=leave_req.total_days,
        reason=leave_req.reason,
        status=leave_req.status,
        approver_id=leave_req.approver_id,
        action_reason=leave_req.action_reason,
        action_at=leave_req.action_at,
        leave_type_name=lt.name if lt else None,
        leave_type_code=lt.code if lt else None,
        employee_name=f"{emp.first_name} {emp.last_name}".strip() if emp else None,
        employee_code=emp.employee_code if emp else None,
        approver_name=None,
        created_at=leave_req.created_at,
        updated_at=leave_req.updated_at,
    )


def list_leave_requests(
    db: Session,
    organization_id: UUID,
    employee_id: UUID | None = None,
    status_filter: str | None = None,
) -> list[LeaveRequestResponse]:
    """Query leave requests with tenant isolation and optional employee/status filters."""
    if not _is_table_available(db, "leave_requests"):
        return []

    stmt = (
        select(LeaveRequest, LeaveType, Employee, User)
        .join(LeaveType, LeaveRequest.leave_type_id == LeaveType.id)
        .join(Employee, LeaveRequest.employee_id == Employee.id)
        .outerjoin(User, LeaveRequest.approver_id == User.id)
        .where(LeaveRequest.organization_id == organization_id)
    )

    if employee_id:
        stmt = stmt.where(LeaveRequest.employee_id == employee_id)
    if status_filter:
        stmt = stmt.where(LeaveRequest.status == status_filter.strip().upper())

    stmt = stmt.order_by(LeaveRequest.created_at.desc())
    results = db.execute(stmt).all()

    output = []
    for req, lt, emp, approver in results:
        output.append(
            LeaveRequestResponse(
                id=req.id,
                organization_id=req.organization_id,
                employee_id=req.employee_id,
                leave_type_id=req.leave_type_id,
                start_date=req.start_date,
                end_date=req.end_date,
                total_days=req.total_days,
                reason=req.reason,
                status=req.status,
                approver_id=req.approver_id,
                action_reason=req.action_reason,
                action_at=req.action_at,
                leave_type_name=lt.name,
                leave_type_code=lt.code,
                employee_name=f"{emp.first_name} {emp.last_name}".strip(),
                employee_code=emp.employee_code,
                approver_name=approver.email if approver else None,
                created_at=req.created_at,
                updated_at=req.updated_at,
            )
        )
    return output
