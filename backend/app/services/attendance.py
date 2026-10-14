from datetime import date, datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.shift import Shift
from app.schemas.attendance import TodayAttendanceSummary


def ensure_utc(dt: datetime | None) -> datetime:
    """Ensure a datetime object is timezone-aware and set to UTC."""
    if dt is None:
        return datetime.now(timezone.utc)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def record_check_in(
    db: Session,
    organization_id: UUID,
    employee_id: UUID,
    shift_id: UUID | None = None,
    check_in_time: datetime | None = None,
    notes: str | None = None,
) -> Attendance:
    """
    Record an employee check-in for the organization.
    Validates employee, checks for duplicate punches on the attendance date,
    determines effective shift and calculates lateness with grace period.
    """
    effective_check_in = ensure_utc(check_in_time)
    attendance_date = effective_check_in.date()

    # 1. Verify employee belongs to organization
    emp_stmt = select(Employee).where(
        Employee.id == employee_id,
        Employee.organization_id == organization_id,
    )
    employee = db.execute(emp_stmt).scalar_one_or_none()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found in this organization",
        )

    # 2. Prevent duplicate check-in for the same date
    dup_stmt = select(Attendance).where(
        Attendance.organization_id == organization_id,
        Attendance.employee_id == employee_id,
        Attendance.attendance_date == attendance_date,
    )
    existing_attendance = db.execute(dup_stmt).scalar_one_or_none()
    if existing_attendance:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Employee already checked in for date {attendance_date}",
        )

    # 3. Resolve shift
    target_shift: Shift | None = None
    if shift_id is not None:
        shift_stmt = select(Shift).where(
            Shift.id == shift_id,
            Shift.organization_id == organization_id,
        )
        target_shift = db.execute(shift_stmt).scalar_one_or_none()
        if not target_shift:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected shift does not exist in this organization",
            )
        if not target_shift.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot check in with an inactive shift",
            )
    elif employee.shift_id is not None:
        emp_shift_stmt = select(Shift).where(
            Shift.id == employee.shift_id,
            Shift.organization_id == organization_id,
        )
        emp_shift = db.execute(emp_shift_stmt).scalar_one_or_none()
        if emp_shift:
            if not emp_shift.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Employee's assigned shift is inactive. Contact HR to update shift assignment.",
                )
            target_shift = emp_shift

    # 4. Calculate lateness with grace period
    late_minutes = 0
    att_status = "PRESENT"

    if target_shift is not None:
        scheduled_start = datetime.combine(
            attendance_date,
            target_shift.start_time,
        ).replace(tzinfo=timezone.utc)
        grace_cutoff = scheduled_start + timedelta(minutes=target_shift.grace_period_minutes)

        if effective_check_in > grace_cutoff:
            diff_seconds = (effective_check_in - scheduled_start).total_seconds()
            late_minutes = max(0, int(diff_seconds // 60))
            att_status = "LATE"

    # 5. Create attendance record
    attendance = Attendance(
        id=uuid4(),
        organization_id=organization_id,
        employee_id=employee_id,
        shift_id=target_shift.id if target_shift else None,
        attendance_date=attendance_date,
        check_in_time=effective_check_in,
        check_out_time=None,
        status=att_status,
        late_minutes=late_minutes,
        working_minutes=0,
        notes=notes.strip() if notes else None,
    )

    try:
        db.add(attendance)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Employee already checked in for date {attendance_date}",
        )

    # Re-fetch with eager loaded relationships for response
    fetch_stmt = (
        select(Attendance)
        .options(
            joinedload(Attendance.employee).joinedload(Employee.department),
            joinedload(Attendance.shift),
        )
        .where(Attendance.id == attendance.id)
    )
    return db.execute(fetch_stmt).scalar_one()


def record_check_out(
    db: Session,
    organization_id: UUID,
    employee_id: UUID,
    check_out_time: datetime | None = None,
    notes: str | None = None,
) -> Attendance:
    """
    Record an employee check-out for the organization.
    Finds active attendance record, validates check-out is after check-in,
    calculates working minutes and updates status (HALF_DAY if < 4 hours).
    """
    effective_check_out = ensure_utc(check_out_time)
    attendance_date = effective_check_out.date()

    # 1. Find attendance record for today or latest unclosed punch
    att_stmt = (
        select(Attendance)
        .where(
            Attendance.organization_id == organization_id,
            Attendance.employee_id == employee_id,
            Attendance.attendance_date == attendance_date,
        )
    )
    attendance = db.execute(att_stmt).scalar_one_or_none()

    if not attendance:
        # Fallback to the latest punch without check_out_time
        open_stmt = (
            select(Attendance)
            .where(
                Attendance.organization_id == organization_id,
                Attendance.employee_id == employee_id,
                Attendance.check_out_time.is_(None),
            )
            .order_by(Attendance.check_in_time.desc())
        )
        attendance = db.execute(open_stmt).scalar_one_or_none()

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No check-in record found. Please check in first.",
        )

    if attendance.check_out_time is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Employee already checked out for date {attendance.attendance_date}",
        )

    # 2. Validate check-out is at or after check-in
    check_in_utc = ensure_utc(attendance.check_in_time)
    if effective_check_out < check_in_utc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-out time cannot be earlier than check-in time",
        )

    # 3. Calculate working minutes
    diff_seconds = (effective_check_out - check_in_utc).total_seconds()
    working_minutes = max(0, int(diff_seconds // 60))

    # 4. Status determination (half day if working minutes < 240 / 4 hours)
    if working_minutes < 240:
        attendance.status = "HALF_DAY"
    elif attendance.late_minutes > 0:
        attendance.status = "LATE"
    else:
        attendance.status = "PRESENT"

    attendance.check_out_time = effective_check_out
    attendance.working_minutes = working_minutes
    if notes:
        existing_notes = attendance.notes or ""
        combined = f"{existing_notes} | {notes.strip()}" if existing_notes else notes.strip()
        attendance.notes = combined[:255]

    attendance.updated_at = datetime.utcnow()
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Employee already checked out for date {attendance.attendance_date}",
        )

    fetch_stmt = (
        select(Attendance)
        .options(
            joinedload(Attendance.employee).joinedload(Employee.department),
            joinedload(Attendance.shift),
        )
        .where(Attendance.id == attendance.id)
    )
    return db.execute(fetch_stmt).scalar_one()


def get_today_summary(
    db: Session,
    organization_id: UUID,
    target_date: date | None = None,
    department_id: UUID | None = None,
) -> TodayAttendanceSummary:
    """
    Calculate high-level attendance summary metrics for an organization on a given date.
    Supports optional department filtering for managers.
    Does not invent absence policies: absent_count reflects explicit ABSENT records;
    not_checked_in_count reflects active employees without an attendance punch.
    """
    if target_date is None:
        target_date = datetime.now(timezone.utc).date()

    # Total active employees in organization (or department)
    total_emp_stmt = select(func.count(Employee.id)).where(
        Employee.organization_id == organization_id,
        Employee.employment_status == "ACTIVE",
    )
    if department_id is not None:
        total_emp_stmt = total_emp_stmt.where(Employee.department_id == department_id)

    total_employees = db.execute(total_emp_stmt).scalar() or 0

    # Query attendance records for the target date
    att_stmt = select(Attendance).where(
        Attendance.organization_id == organization_id,
        Attendance.attendance_date == target_date,
    )
    if department_id is not None:
        att_stmt = att_stmt.join(Attendance.employee).where(Employee.department_id == department_id)

    records = db.execute(att_stmt).scalars().all()

    present_count = sum(1 for r in records if r.status == "PRESENT")
    late_count = sum(1 for r in records if r.status == "LATE")
    half_day_count = sum(1 for r in records if r.status == "HALF_DAY")
    # Only count records explicitly marked ABSENT
    absent_count = sum(1 for r in records if r.status == "ABSENT")
    checked_in_count = len(records)
    not_checked_in_count = max(0, total_employees - checked_in_count)

    return TodayAttendanceSummary(
        date=target_date,
        total_employees=total_employees,
        present_count=present_count,
        late_count=late_count,
        absent_count=absent_count,
        half_day_count=half_day_count,
        not_checked_in_count=not_checked_in_count,
    )
