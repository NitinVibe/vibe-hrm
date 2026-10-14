from datetime import datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.permissions import (
    EMPLOYEE_READ_ROLES,
    EMPLOYEE_WRITE_ROLES,
    require_roles,
)
from app.db.session import get_db
from app.models.department import Department
from app.models.designation import Designation
from app.models.employee import Employee
from app.models.shift import Shift
from app.models.user import User
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeResponse,
    EmployeeUpdate,
)

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("", response_model=list[EmployeeResponse])
def list_employees(
    search: str | None = Query(default=None, max_length=100),
    status_filter: str | None = Query(default=None, alias="status", max_length=30),
    department_id: UUID | None = None,
    designation_id: UUID | None = None,
    shift_id: UUID | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(require_roles(*EMPLOYEE_READ_ROLES)),
    db: Session = Depends(get_db),
):
    """
    List all employees scoped strictly to the authenticated user's organization.
    Supports optional search (code, name, email), status, department, designation, and shift filters.
    Loads department, designation, and shift eager relationships to avoid N+1 queries.
    """
    stmt = (
        select(Employee)
        .options(
            joinedload(Employee.department),
            joinedload(Employee.designation),
            joinedload(Employee.shift),
        )
        .where(Employee.organization_id == current_user.organization_id)
    )

    clean_dept_id = department_id if isinstance(department_id, UUID) else None
    if clean_dept_id is not None:
        stmt = stmt.where(Employee.department_id == clean_dept_id)

    clean_desig_id = designation_id if isinstance(designation_id, UUID) else None
    if clean_desig_id is not None:
        stmt = stmt.where(Employee.designation_id == clean_desig_id)

    clean_shift_id = shift_id if isinstance(shift_id, UUID) else None
    if clean_shift_id is not None:
        stmt = stmt.where(Employee.shift_id == clean_shift_id)

    clean_status = status_filter if isinstance(status_filter, str) and status_filter.strip() else None
    if clean_status:
        stmt = stmt.where(
            Employee.employment_status.ilike(clean_status.strip())
        )

    clean_search = search if isinstance(search, str) and search.strip() else None
    if clean_search:
        term = f"%{clean_search.strip()}%"
        stmt = stmt.where(
            or_(
                Employee.employee_code.ilike(term),
                Employee.first_name.ilike(term),
                Employee.last_name.ilike(term),
                Employee.email.ilike(term),
            )
        )

    clean_limit = limit if isinstance(limit, int) and limit > 0 else 50
    clean_offset = offset if isinstance(offset, int) and offset >= 0 else 0
    clean_limit = min(clean_limit, 100)

    stmt = stmt.order_by(Employee.created_at.desc()).offset(clean_offset).limit(clean_limit)
    employees = db.execute(stmt).scalars().all()
    return list(employees)


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: UUID,
    current_user: User = Depends(require_roles(*EMPLOYEE_READ_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Retrieve single employee by ID scoped to current organization.
    Loads department, designation, and shift relationships. Returns 404 if not found.
    """
    stmt = (
        select(Employee)
        .options(
            joinedload(Employee.department),
            joinedload(Employee.designation),
            joinedload(Employee.shift),
        )
        .where(
            Employee.id == employee_id,
            Employee.organization_id == current_user.organization_id,
        )
    )
    employee = db.execute(stmt).scalar_one_or_none()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )
    return employee


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    current_user: User = Depends(require_roles(*EMPLOYEE_WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Create a new employee record within the authenticated user's organization.
    Enforces tenant scoping, employee code uniqueness, user linkage validation,
    and department & designation compatibility and active status.
    """
    # 1. Enforce employee_code uniqueness within current organization
    code_stmt = select(Employee).where(
        Employee.organization_id == current_user.organization_id,
        Employee.employee_code == payload.employee_code,
    )
    existing_code = db.execute(code_stmt).scalar_one_or_none()
    if existing_code:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Employee code '{payload.employee_code}' already exists in this organization",
        )

    # 2. Validate optional user_id linkage
    if payload.user_id is not None:
        user_stmt = select(User).where(
            User.id == payload.user_id,
            User.organization_id == current_user.organization_id,
        )
        target_user = db.execute(user_stmt).scalar_one_or_none()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected user does not belong to this organization",
            )

        existing_user_link = db.execute(
            select(Employee).where(Employee.user_id == payload.user_id)
        ).scalar_one_or_none()
        if existing_user_link:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Selected user is already linked to an employee record",
            )

    # 3. Validate assignment compatibility & active status
    if payload.designation_id is not None and payload.department_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign designation without selecting a department",
        )

    if payload.department_id is not None:
        dept = db.execute(
            select(Department).where(
                Department.id == payload.department_id,
                Department.organization_id == current_user.organization_id,
            )
        ).scalar_one_or_none()
        if not dept:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected department does not exist in this organization",
            )
        if not dept.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign inactive department to an employee",
            )

    if payload.designation_id is not None:
        desig = db.execute(
            select(Designation).where(
                Designation.id == payload.designation_id,
                Designation.organization_id == current_user.organization_id,
            )
        ).scalar_one_or_none()
        if not desig:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected designation does not exist in this organization",
            )
        if desig.department_id != payload.department_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected designation does not belong to the selected department",
            )
        if not desig.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign inactive designation to an employee",
            )

    # 4. Validate shift assignment if provided
    if payload.shift_id is not None:
        shift = db.execute(
            select(Shift).where(
                Shift.id == payload.shift_id,
                Shift.organization_id == current_user.organization_id,
            )
        ).scalar_one_or_none()
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected shift does not exist in this organization",
            )
        if not shift.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign inactive shift to an employee",
            )

    # 5. Create employee record scoped to organization
    new_employee = Employee(
        id=uuid4(),
        organization_id=current_user.organization_id,
        user_id=payload.user_id,
        department_id=payload.department_id,
        designation_id=payload.designation_id,
        shift_id=payload.shift_id,
        employee_code=payload.employee_code,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=str(payload.email) if payload.email else None,
        phone=payload.phone,
        date_of_birth=payload.date_of_birth,
        joining_date=payload.joining_date,
        employment_status=payload.employment_status,
    )

    try:
        db.add(new_employee)
        db.commit()

        # Re-fetch with eager loaded relationships for response
        fetch_stmt = (
            select(Employee)
            .options(
                joinedload(Employee.department),
                joinedload(Employee.designation),
                joinedload(Employee.shift),
            )
            .where(Employee.id == new_employee.id)
        )
        return db.execute(fetch_stmt).scalar_one()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Employee record conflicts with existing data",
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating employee",
        )


@router.patch("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: UUID,
    payload: EmployeeUpdate,
    current_user: User = Depends(require_roles(*EMPLOYEE_WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Update an existing employee record within the authenticated user's organization.
    Only modifies fields explicitly provided in the request payload.
    Validates partial updates against existing employee department and designation state.
    """
    # 1. Fetch employee scoped to organization
    stmt = (
        select(Employee)
        .options(
            joinedload(Employee.department),
            joinedload(Employee.designation),
            joinedload(Employee.shift),
        )
        .where(
            Employee.id == employee_id,
            Employee.organization_id == current_user.organization_id,
        )
    )
    employee = db.execute(stmt).scalar_one_or_none()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        return employee

    # 2. Check employee_code uniqueness if changed
    if "employee_code" in update_data and update_data["employee_code"] is not None:
        new_code = update_data["employee_code"]
        code_stmt = select(Employee).where(
            Employee.organization_id == current_user.organization_id,
            Employee.employee_code == new_code,
            Employee.id != employee_id,
        )
        existing_code = db.execute(code_stmt).scalar_one_or_none()
        if existing_code:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Employee code '{new_code}' already exists in this organization",
            )

    # 3. Validate user_id if changed
    if "user_id" in update_data and update_data["user_id"] is not None:
        target_user_id = update_data["user_id"]
        user_stmt = select(User).where(
            User.id == target_user_id,
            User.organization_id == current_user.organization_id,
        )
        target_user = db.execute(user_stmt).scalar_one_or_none()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected user does not belong to this organization",
            )

        existing_user_link = db.execute(
            select(Employee).where(
                Employee.user_id == target_user_id,
                Employee.id != employee_id,
            )
        ).scalar_one_or_none()
        if existing_user_link:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Selected user is already linked to an employee record",
            )

    # 4. Validate partial department / designation assignment semantics
    has_dept_update = "department_id" in update_data
    has_desig_update = "designation_id" in update_data

    eff_dept_id = update_data["department_id"] if has_dept_update else employee.department_id
    eff_desig_id = update_data["designation_id"] if has_desig_update else employee.designation_id

    # Rule A: Designation cannot exist without a department
    if eff_desig_id is not None and eff_dept_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign or keep a designation without a department. Clear designation_id when removing department.",
        )

    # Rule B: If department changes, reject if incompatible existing designation is not updated or cleared
    if has_dept_update and not has_desig_update and employee.designation_id is not None:
        if update_data["department_id"] != employee.department_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Changing department requires reassigning a compatible designation or explicitly clearing the designation (set designation_id to null)",
            )

    # Rule C: Department validation when assigned
    if has_dept_update and update_data["department_id"] is not None:
        dept = db.execute(
            select(Department).where(
                Department.id == update_data["department_id"],
                Department.organization_id == current_user.organization_id,
            )
        ).scalar_one_or_none()
        if not dept:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected department does not exist in this organization",
            )
        if not dept.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign inactive department to an employee",
            )

    # Rule D: Designation validation when assigned
    if has_desig_update and update_data["designation_id"] is not None:
        desig = db.execute(
            select(Designation).where(
                Designation.id == update_data["designation_id"],
                Designation.organization_id == current_user.organization_id,
            )
        ).scalar_one_or_none()
        if not desig:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected designation does not exist in this organization",
            )
        if desig.department_id != eff_dept_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected designation does not belong to the employee's department",
            )
        if not desig.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign inactive designation to an employee",
            )

    # Rule E: Shift validation when assigned
    if "shift_id" in update_data and update_data["shift_id"] is not None:
        shift = db.execute(
            select(Shift).where(
                Shift.id == update_data["shift_id"],
                Shift.organization_id == current_user.organization_id,
            )
        ).scalar_one_or_none()
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected shift does not exist in this organization",
            )
        if not shift.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign inactive shift to an employee",
            )

    # 5. Apply updates
    for field_name, field_value in update_data.items():
        if field_name == "email" and field_value is not None:
            setattr(employee, field_name, str(field_value))
        else:
            setattr(employee, field_name, field_value)

    employee.updated_at = datetime.utcnow()

    try:
        db.commit()

        # Re-fetch with eager loaded relationships for response
        fetch_stmt = (
            select(Employee)
            .options(
                joinedload(Employee.department),
                joinedload(Employee.designation),
                joinedload(Employee.shift),
            )
            .where(Employee.id == employee.id)
        )
        return db.execute(fetch_stmt).scalar_one()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Employee update conflicts with existing data",
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while updating employee",
        )
