from __future__ import annotations

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import require_roles
from app.db.session import get_db
from app.models.employee import Employee
from app.models.user import User
from app.schemas.leave_request import (
    LeaveRequestAction,
    LeaveRequestCreate,
    LeaveRequestResponse,
)
from app.services import leave_service

router = APIRouter(prefix="/leave-requests", tags=["Leave Requests"])

LEAVE_APPROVER_ROLES = ("SUPER_ADMIN", "ORG_ADMIN", "HR", "MANAGER")
ALL_ROLES = ("SUPER_ADMIN", "ORG_ADMIN", "HR", "MANAGER", "EMPLOYEE")


@router.post("", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED, summary="Apply for leave")
def apply_leave(
    payload: LeaveRequestCreate,
    employee_id: UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ALL_ROLES)),
):
    target_emp_id = employee_id
    if not target_emp_id:
        emp = db.execute(
            select(Employee).where(
                Employee.organization_id == current_user.organization_id,
                Employee.user_id == current_user.id,
            )
        ).scalar_one_or_none()
        if not emp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No employee record linked to the current user. An employee ID must be specified.",
            )
        target_emp_id = emp.id

    return leave_service.apply_for_leave(
        db=db,
        organization_id=current_user.organization_id,
        employee_id=target_emp_id,
        payload=payload,
    )


@router.get("", response_model=list[LeaveRequestResponse], summary="List organization leave requests")
def list_leave_requests(
    employee_id: UUID | None = None,
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ALL_ROLES)),
):
    # If regular employee, only show their own requests
    filter_emp_id = employee_id
    # Check if user has management role
    role_name = current_user.role.name if current_user.role else ""
    if role_name == "EMPLOYEE":
        emp = db.execute(
            select(Employee).where(
                Employee.organization_id == current_user.organization_id,
                Employee.user_id == current_user.id,
            )
        ).scalar_one_or_none()
        if not emp:
            return []
        filter_emp_id = emp.id

    return leave_service.list_leave_requests(
        db=db,
        organization_id=current_user.organization_id,
        employee_id=filter_emp_id,
        status_filter=status_filter,
    )


@router.get("/me", response_model=list[LeaveRequestResponse], summary="List current authenticated employee's leave requests")
def list_my_leave_requests(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ALL_ROLES)),
):
    emp = db.execute(
        select(Employee).where(
            Employee.organization_id == current_user.organization_id,
            Employee.user_id == current_user.id,
        )
    ).scalar_one_or_none()
    if not emp:
        return []

    return leave_service.list_leave_requests(
        db=db,
        organization_id=current_user.organization_id,
        employee_id=emp.id,
        status_filter=status_filter,
    )


@router.post("/{request_id}/action", response_model=LeaveRequestResponse, summary="Approve or reject a leave request")
def action_leave_request(
    request_id: UUID,
    payload: LeaveRequestAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*LEAVE_APPROVER_ROLES)),
):
    return leave_service.process_leave_request_action(
        db=db,
        organization_id=current_user.organization_id,
        request_id=request_id,
        approver_user_id=current_user.id,
        action=payload.action,
        action_reason=payload.action_reason,
    )


@router.post("/{request_id}/cancel", response_model=LeaveRequestResponse, summary="Cancel a leave request")
def cancel_leave_request(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ALL_ROLES)),
):
    # If regular employee, enforce employee ownership
    role_name = current_user.role.name if current_user.role else ""
    owner_emp_id = None
    if role_name == "EMPLOYEE":
        emp = db.execute(
            select(Employee).where(
                Employee.organization_id == current_user.organization_id,
                Employee.user_id == current_user.id,
            )
        ).scalar_one_or_none()
        if not emp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")
        owner_emp_id = emp.id

    return leave_service.cancel_leave_request(
        db=db,
        organization_id=current_user.organization_id,
        request_id=request_id,
        employee_id=owner_emp_id,
    )
