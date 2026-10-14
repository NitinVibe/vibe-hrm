from datetime import datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.permissions import (
    SHIFT_READ_ROLES,
    SHIFT_WRITE_ROLES,
    require_roles,
)
from app.db.session import get_db
from app.models.employee import Employee
from app.models.shift import Shift
from app.models.user import User
from app.schemas.shift import ShiftCreate, ShiftResponse, ShiftUpdate

router = APIRouter(prefix="/shifts", tags=["Shifts"])


@router.get("", response_model=list[ShiftResponse])
def list_shifts(
    search: str | None = Query(default=None, max_length=100),
    is_active: bool | None = Query(default=None),
    current_user: User = Depends(require_roles(*SHIFT_READ_ROLES)),
    db: Session = Depends(get_db),
):
    """
    List all shifts scoped strictly to the authenticated user's organization.
    Supports optional search and active status filters.
    """
    stmt = select(Shift).where(Shift.organization_id == current_user.organization_id)

    clean_active = is_active if isinstance(is_active, bool) else None
    if clean_active is not None:
        stmt = stmt.where(Shift.is_active == clean_active)

    clean_search = search if isinstance(search, str) and search.strip() else None
    if clean_search:
        term = f"%{clean_search.strip()}%"
        stmt = stmt.where(Shift.name.ilike(term))

    stmt = stmt.order_by(Shift.created_at.desc())
    shifts = db.execute(stmt).scalars().all()
    return list(shifts)


@router.get("/{shift_id}", response_model=ShiftResponse)
def get_shift(
    shift_id: UUID,
    current_user: User = Depends(require_roles(*SHIFT_READ_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Retrieve single shift by ID scoped to the authenticated user's organization.
    """
    stmt = select(Shift).where(
        Shift.id == shift_id,
        Shift.organization_id == current_user.organization_id,
    )
    shift = db.execute(stmt).scalar_one_or_none()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found",
        )
    return shift


@router.post("", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
def create_shift(
    payload: ShiftCreate,
    current_user: User = Depends(require_roles(*SHIFT_WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Create a new shift within the authenticated user's organization.
    Enforces tenant scoping, case-insensitive unique naming, and non-overnight shift time constraints.
    """
    # 1. Enforce unique shift name (case-insensitive) within tenant
    dup_stmt = select(Shift).where(
        Shift.organization_id == current_user.organization_id,
        func.lower(Shift.name) == payload.name.lower(),
    )
    if db.execute(dup_stmt).scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Shift with name '{payload.name}' already exists in this organization",
        )

    shift = Shift(
        id=uuid4(),
        organization_id=current_user.organization_id,
        name=payload.name,
        start_time=payload.start_time,
        end_time=payload.end_time,
        grace_period_minutes=payload.grace_period_minutes,
        is_active=payload.is_active,
    )

    try:
        db.add(shift)
        db.commit()
        db.refresh(shift)
        return shift
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Shift record conflicts with existing data",
        )


@router.patch("/{shift_id}", response_model=ShiftResponse)
def update_shift(
    shift_id: UUID,
    payload: ShiftUpdate,
    current_user: User = Depends(require_roles(*SHIFT_WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Update an existing shift within the authenticated user's organization.
    Enforces name uniqueness, time ordering, and deactivation guards against assigned active employees.
    """
    stmt = select(Shift).where(
        Shift.id == shift_id,
        Shift.organization_id == current_user.organization_id,
    )
    shift = db.execute(stmt).scalar_one_or_none()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        return shift

    # 1. Enforce unique name if changed
    if "name" in update_data and update_data["name"] is not None:
        new_name = update_data["name"]
        dup_stmt = select(Shift).where(
            Shift.organization_id == current_user.organization_id,
            func.lower(Shift.name) == new_name.lower(),
            Shift.id != shift_id,
        )
        if db.execute(dup_stmt).scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Shift with name '{new_name}' already exists in this organization",
            )

    # 2. Time validation if start_time or end_time updated
    effective_start = update_data.get("start_time", shift.start_time)
    effective_end = update_data.get("end_time", shift.end_time)
    if "start_time" in update_data or "end_time" in update_data:
        if effective_start == effective_end:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Shift start_time and end_time cannot be equal",
            )
        if effective_end <= effective_start:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Overnight shifts are not supported; end_time must be after start_time",
            )

    # 3. Deactivation guard: ensure no active employees assigned
    if update_data.get("is_active") is False and shift.is_active:
        assigned_emp_stmt = select(Employee).where(
            Employee.organization_id == current_user.organization_id,
            Employee.shift_id == shift.id,
            Employee.employment_status == "ACTIVE",
        )
        assigned_emp = db.execute(assigned_emp_stmt).first()
        if assigned_emp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate shift assigned to active employees. Reassign employees first.",
            )

    # 4. Apply updates
    for field_name, field_value in update_data.items():
        setattr(shift, field_name, field_value)

    shift.updated_at = datetime.utcnow()

    try:
        db.commit()
        db.refresh(shift)
        return shift
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Shift update conflicts with existing data",
        )
