from datetime import datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.permissions import (
    EMPLOYEE_READ_ROLES,
    EMPLOYEE_WRITE_ROLES,
    require_roles,
)
from app.db.session import get_db
from app.models.department import Department
from app.models.designation import Designation
from app.models.employee import Employee
from app.models.user import User
from app.schemas.designation import (
    DesignationCreate,
    DesignationResponse,
    DesignationUpdate,
)

router = APIRouter(prefix="/designations", tags=["Designations"])


@router.get("", response_model=list[DesignationResponse])
def list_designations(
    department_id: UUID | None = Query(default=None),
    search: str | None = Query(default=None, max_length=100),
    is_active: bool | None = Query(default=None),
    current_user: User = Depends(require_roles(*EMPLOYEE_READ_ROLES)),
    db: Session = Depends(get_db),
):
    """
    List all designations scoped strictly to the authenticated user's organization.
    Supports optional department filter, search, and active status filters.
    """
    stmt = select(Designation).where(
        Designation.organization_id == current_user.organization_id
    )

    if department_id is not None:
        stmt = stmt.where(Designation.department_id == department_id)

    if is_active is not None:
        stmt = stmt.where(Designation.is_active == is_active)

    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Designation.name.ilike(term),
                Designation.description.ilike(term),
            )
        )

    stmt = stmt.order_by(Designation.name.asc())
    designations = db.execute(stmt).scalars().all()
    return list(designations)


@router.get("/{designation_id}", response_model=DesignationResponse)
def get_designation(
    designation_id: UUID,
    current_user: User = Depends(require_roles(*EMPLOYEE_READ_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Retrieve single designation by ID scoped to current organization.
    Returns 404 if not found in this organization.
    """
    stmt = select(Designation).where(
        Designation.id == designation_id,
        Designation.organization_id == current_user.organization_id,
    )
    designation = db.execute(stmt).scalar_one_or_none()
    if not designation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Designation not found",
        )
    return designation


@router.post("", response_model=DesignationResponse, status_code=status.HTTP_201_CREATED)
def create_designation(
    payload: DesignationCreate,
    current_user: User = Depends(require_roles(*EMPLOYEE_WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Create a new designation within the authenticated user's organization.
    Enforces tenant scoping, validates department belongs to the same organization,
    and enforces designation name uniqueness per organization.
    """
    # 1. Validate that department exists and belongs to the current user's organization
    dept = db.execute(
        select(Department).where(
            Department.id == payload.department_id,
            Department.organization_id == current_user.organization_id,
        )
    ).scalar_one_or_none()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected department does not exist in your organization",
        )
    if not dept.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create designation under an inactive department",
        )

    # 2. Enforce designation name uniqueness within current organization
    existing = db.execute(
        select(Designation).where(
            Designation.organization_id == current_user.organization_id,
            func.lower(Designation.name) == func.lower(payload.name),
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Designation '{payload.name}' already exists in this organization",
        )

    # 3. Create designation record scoped to organization
    new_designation = Designation(
        id=uuid4(),
        organization_id=current_user.organization_id,
        department_id=payload.department_id,
        name=payload.name,
        description=payload.description,
        is_active=payload.is_active,
    )

    try:
        db.add(new_designation)
        db.commit()
        db.refresh(new_designation)
        return new_designation
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Designation record conflicts with existing data",
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating designation",
        )


@router.patch("/{designation_id}", response_model=DesignationResponse)
def update_designation(
    designation_id: UUID,
    payload: DesignationUpdate,
    current_user: User = Depends(require_roles(*EMPLOYEE_WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Update an existing designation within the authenticated user's organization.
    Enforces tenant scoping, department validation, and name uniqueness.
    """
    # 1. Fetch designation scoped to organization
    stmt = select(Designation).where(
        Designation.id == designation_id,
        Designation.organization_id == current_user.organization_id,
    )
    designation = db.execute(stmt).scalar_one_or_none()
    if not designation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Designation not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        return designation

    # 2. Validate department if changed
    if "department_id" in update_data and update_data["department_id"] is not None:
        target_dept_id = update_data["department_id"]
        target_dept = db.execute(
            select(Department).where(
                Department.id == target_dept_id,
                Department.organization_id == current_user.organization_id,
            )
        ).scalar_one_or_none()
        if not target_dept:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected department does not exist in your organization",
            )
        if not target_dept.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot reassign designation to an inactive department",
            )

    # 3. Check if activating designation under an inactive department
    if update_data.get("is_active") is True:
        target_dept_id = update_data.get("department_id", designation.department_id)
        parent_dept = db.execute(
            select(Department).where(
                Department.id == target_dept_id,
                Department.organization_id == current_user.organization_id,
            )
        ).scalar_one_or_none()
        if parent_dept and not parent_dept.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot activate designation under an inactive department",
            )

    # 3. Check name uniqueness if changed
    if "name" in update_data and update_data["name"] is not None:
        new_name = update_data["name"]
        existing = db.execute(
            select(Designation).where(
                Designation.organization_id == current_user.organization_id,
                func.lower(Designation.name) == func.lower(new_name),
                Designation.id != designation_id,
            )
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Designation '{new_name}' already exists in this organization",
            )

    # 4. Safe deactivation check: do not allow deactivating if active employees exist
    if update_data.get("is_active") is False:
        active_emp_count = db.execute(
            select(func.count(Employee.id)).where(
                Employee.designation_id == designation_id,
                Employee.organization_id == current_user.organization_id,
                Employee.employment_status == "ACTIVE",
            )
        ).scalar() or 0
        if active_emp_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot deactivate designation with {active_emp_count} active employee(s). Reassign associated employees first.",
            )

    # 5. Apply updates
    for field_name, field_value in update_data.items():
        setattr(designation, field_name, field_value)

    designation.updated_at = datetime.utcnow()

    try:
        db.commit()
        db.refresh(designation)
        return designation
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Designation update conflicts with existing data",
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while updating designation",
        )
