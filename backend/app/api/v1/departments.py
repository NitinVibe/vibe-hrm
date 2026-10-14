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
from app.schemas.department import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("", response_model=list[DepartmentResponse])
def list_departments(
    search: str | None = Query(default=None, max_length=100),
    is_active: bool | None = Query(default=None),
    current_user: User = Depends(require_roles(*EMPLOYEE_READ_ROLES)),
    db: Session = Depends(get_db),
):
    """
    List all departments scoped strictly to the authenticated user's organization.
    Supports optional search and active status filters.
    """
    stmt = select(Department).where(
        Department.organization_id == current_user.organization_id
    )

    if is_active is not None:
        stmt = stmt.where(Department.is_active == is_active)

    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Department.name.ilike(term),
                Department.description.ilike(term),
            )
        )

    stmt = stmt.order_by(Department.name.asc())
    departments = db.execute(stmt).scalars().all()
    return list(departments)


@router.get("/{department_id}", response_model=DepartmentResponse)
def get_department(
    department_id: UUID,
    current_user: User = Depends(require_roles(*EMPLOYEE_READ_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Retrieve single department by ID scoped to current organization.
    Returns 404 if not found in this organization.
    """
    stmt = select(Department).where(
        Department.id == department_id,
        Department.organization_id == current_user.organization_id,
    )
    department = db.execute(stmt).scalar_one_or_none()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )
    return department


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    current_user: User = Depends(require_roles(*EMPLOYEE_WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Create a new department within the authenticated user's organization.
    Enforces tenant scoping and department name uniqueness per organization.
    """
    # 1. Enforce department name uniqueness within current organization
    existing = db.execute(
        select(Department).where(
            Department.organization_id == current_user.organization_id,
            func.lower(Department.name) == func.lower(payload.name),
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Department '{payload.name}' already exists in this organization",
        )

    # 2. Create department record scoped to organization
    new_department = Department(
        id=uuid4(),
        organization_id=current_user.organization_id,
        name=payload.name,
        description=payload.description,
        is_active=payload.is_active,
    )

    try:
        db.add(new_department)
        db.commit()
        db.refresh(new_department)
        return new_department
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department record conflicts with existing data",
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating department",
        )


@router.patch("/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: UUID,
    payload: DepartmentUpdate,
    current_user: User = Depends(require_roles(*EMPLOYEE_WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Update an existing department within the authenticated user's organization.
    Enforces tenant scoping, name uniqueness, and blocks deactivation if active designations exist.
    """
    # 1. Fetch department scoped to organization
    stmt = select(Department).where(
        Department.id == department_id,
        Department.organization_id == current_user.organization_id,
    )
    department = db.execute(stmt).scalar_one_or_none()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        return department

    # 2. Check name uniqueness if changed
    if "name" in update_data and update_data["name"] is not None:
        new_name = update_data["name"]
        existing = db.execute(
            select(Department).where(
                Department.organization_id == current_user.organization_id,
                func.lower(Department.name) == func.lower(new_name),
                Department.id != department_id,
            )
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Department '{new_name}' already exists in this organization",
            )

    # 3. Safe deactivation check: do not allow deactivating if active designations or employees exist
    if update_data.get("is_active") is False:
        active_desig_count = db.execute(
            select(func.count(Designation.id)).where(
                Designation.department_id == department_id,
                Designation.organization_id == current_user.organization_id,
                Designation.is_active.is_(True),
            )
        ).scalar_one()
        if active_desig_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot deactivate department with {active_desig_count} active designation(s). Deactivate or reassign associated designations first.",
            )

        active_emp_count = db.execute(
            select(func.count(Employee.id)).where(
                Employee.department_id == department_id,
                Employee.organization_id == current_user.organization_id,
                Employee.employment_status == "ACTIVE",
            )
        ).scalar() or 0
        if active_emp_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot deactivate department with {active_emp_count} active employee(s). Reassign associated employees first.",
            )

    # 4. Apply updates
    for field_name, field_value in update_data.items():
        setattr(department, field_name, field_value)

    department.updated_at = datetime.utcnow()

    try:
        db.commit()
        db.refresh(department)
        return department
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department update conflicts with existing data",
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while updating department",
        )
