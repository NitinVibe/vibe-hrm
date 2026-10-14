from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.permissions import (
    ATTENDANCE_READ_ROLES,
    get_current_user,
    require_roles,
)
from app.db.session import get_db
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.role import Role
from app.models.user import User
from app.schemas.attendance import (
    AttendanceResponse,
    CheckInRequest,
    CheckOutRequest,
    TodayAttendanceSummary,
)
from app.services.attendance import (
    get_today_summary,
    record_check_in,
    record_check_out,
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])


def get_current_user_employee(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Employee:
    """Helper dependency to resolve the Employee record linked to the authenticated user."""
    stmt = select(Employee).where(
        Employee.user_id == current_user.id,
        Employee.organization_id == current_user.organization_id,
    )
    employee = db.execute(stmt).scalar_one_or_none()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user is not linked to an employee profile",
        )
    return employee


@router.post("/check-in", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def check_in(
    payload: CheckInRequest,
    current_user: User = Depends(get_current_user),
    employee: Employee = Depends(get_current_user_employee),
    db: Session = Depends(get_db),
):
    """
    Self-service check-in endpoint for the authenticated user's linked employee profile.
    Calculates lateness against assigned or selected shift and prevents duplicate check-in.
    Regular employees cannot override assigned shifts to evade lateness calculations.
    """
    if payload.shift_id is not None:
        role_stmt = select(Role.name).where(Role.id == current_user.role_id)
        user_role = db.execute(role_stmt).scalar_one_or_none()
        if user_role not in ("SUPER_ADMIN", "ORG_ADMIN", "HR", "MANAGER"):
            if employee.shift_id is not None and payload.shift_id != employee.shift_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Employees cannot override their assigned shift. Contact manager or HR for shift reassignments.",
                )
            elif employee.shift_id is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Employees without assigned shifts cannot self-assign shifts during check-in.",
                )

    return record_check_in(
        db=db,
        organization_id=current_user.organization_id,
        employee_id=employee.id,
        shift_id=payload.shift_id,
        check_in_time=payload.check_in_time,
        notes=payload.notes,
    )


@router.post("/check-out", response_model=AttendanceResponse)
def check_out(
    payload: CheckOutRequest,
    current_user: User = Depends(get_current_user),
    employee: Employee = Depends(get_current_user_employee),
    db: Session = Depends(get_db),
):
    """
    Self-service check-out endpoint for the authenticated user's linked employee profile.
    Calculates working minutes and updates attendance status.
    """
    return record_check_out(
        db=db,
        organization_id=current_user.organization_id,
        employee_id=employee.id,
        check_out_time=payload.check_out_time,
        notes=payload.notes,
    )


@router.get("/today", response_model=TodayAttendanceSummary)
def get_today_attendance_summary(
    target_date: date | None = Query(default=None, alias="date"),
    current_user: User = Depends(require_roles(*ATTENDANCE_READ_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Retrieve aggregated attendance metrics for today (or specified date) for the organization.
    For Managers, metrics are scoped to their assigned department.
    """
    clean_target_date = target_date if isinstance(target_date, date) else None

    # Enforce manager department scoping
    role_stmt = select(Role.name).where(Role.id == current_user.role_id)
    user_role = db.execute(role_stmt).scalar_one_or_none()
    effective_dept_id: UUID | None = None

    if user_role == "MANAGER":
        mgr_emp_stmt = select(Employee).where(
            Employee.user_id == current_user.id,
            Employee.organization_id == current_user.organization_id,
        )
        mgr_emp = db.execute(mgr_emp_stmt).scalar_one_or_none()
        if not mgr_emp or not mgr_emp.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Manager is not assigned to any department",
            )
        effective_dept_id = mgr_emp.department_id

    return get_today_summary(
        db=db,
        organization_id=current_user.organization_id,
        target_date=clean_target_date,
        department_id=effective_dept_id,
    )


@router.get("/my", response_model=list[AttendanceResponse])
def get_my_attendance(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    limit: int = Query(default=30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    employee: Employee = Depends(get_current_user_employee),
    db: Session = Depends(get_db),
):
    """
    Retrieve attendance history for the currently authenticated employee.
    """
    stmt = (
        select(Attendance)
        .options(
            joinedload(Attendance.employee).joinedload(Employee.department),
            joinedload(Attendance.shift),
        )
        .where(
            Attendance.organization_id == current_user.organization_id,
            Attendance.employee_id == employee.id,
        )
    )

    clean_start_date = start_date if isinstance(start_date, date) else None
    if clean_start_date:
        stmt = stmt.where(Attendance.attendance_date >= clean_start_date)

    clean_end_date = end_date if isinstance(end_date, date) else None
    if clean_end_date:
        stmt = stmt.where(Attendance.attendance_date <= clean_end_date)

    clean_limit = limit if isinstance(limit, int) else 30
    stmt = stmt.order_by(Attendance.attendance_date.desc()).limit(clean_limit)
    records = db.execute(stmt).scalars().all()
    return list(records)


@router.get("", response_model=list[AttendanceResponse])
def list_attendance(
    attendance_date: date | None = Query(default=None, alias="date"),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    employee_id: UUID | None = Query(default=None),
    department_id: UUID | None = Query(default=None),
    shift_id: UUID | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(require_roles(*ATTENDANCE_READ_ROLES)),
    db: Session = Depends(get_db),
):
    """
    List organization-wide attendance records with multi-criteria filtering.
    Scoped strictly to the authenticated user's organization.
    Managers are restricted strictly to employees within their assigned department.
    """
    stmt = (
        select(Attendance)
        .options(
            joinedload(Attendance.employee).joinedload(Employee.department),
            joinedload(Attendance.employee).joinedload(Employee.designation),
            joinedload(Attendance.shift),
        )
        .where(Attendance.organization_id == current_user.organization_id)
    )

    # Enforce manager department scoping
    role_stmt = select(Role.name).where(Role.id == current_user.role_id)
    user_role = db.execute(role_stmt).scalar_one_or_none()
    clean_dept_id = department_id if isinstance(department_id, UUID) else None

    if user_role == "MANAGER":
        mgr_emp_stmt = select(Employee).where(
            Employee.user_id == current_user.id,
            Employee.organization_id == current_user.organization_id,
        )
        mgr_emp = db.execute(mgr_emp_stmt).scalar_one_or_none()
        if not mgr_emp or not mgr_emp.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Manager is not assigned to any department",
            )
        if clean_dept_id and clean_dept_id != mgr_emp.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers can only view attendance for their assigned department",
            )
        clean_dept_id = mgr_emp.department_id

    clean_att_date = attendance_date if isinstance(attendance_date, date) else None
    if clean_att_date:
        stmt = stmt.where(Attendance.attendance_date == clean_att_date)

    clean_start_date = start_date if isinstance(start_date, date) else None
    if clean_start_date:
        stmt = stmt.where(Attendance.attendance_date >= clean_start_date)

    clean_end_date = end_date if isinstance(end_date, date) else None
    if clean_end_date:
        stmt = stmt.where(Attendance.attendance_date <= clean_end_date)

    clean_emp_id = employee_id if isinstance(employee_id, UUID) else None
    if clean_emp_id:
        stmt = stmt.where(Attendance.employee_id == clean_emp_id)

    clean_shift_id = shift_id if isinstance(shift_id, UUID) else None
    if clean_shift_id:
        stmt = stmt.where(Attendance.shift_id == clean_shift_id)

    clean_status = status_filter if isinstance(status_filter, str) and status_filter.strip() else None
    if clean_status:
        stmt = stmt.where(Attendance.status.ilike(clean_status.strip()))

    if clean_dept_id:
        stmt = stmt.join(Attendance.employee).where(Employee.department_id == clean_dept_id)

    clean_limit = limit if isinstance(limit, int) and limit > 0 else 50
    clean_offset = offset if isinstance(offset, int) and offset >= 0 else 0
    clean_limit = min(clean_limit, 100)

    stmt = stmt.order_by(Attendance.attendance_date.desc(), Attendance.check_in_time.desc()).offset(clean_offset).limit(clean_limit)
    records = db.execute(stmt).scalars().all()
    return list(records)
