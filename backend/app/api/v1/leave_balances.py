from __future__ import annotations

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import require_roles
from app.db.session import get_db
from app.models.employee import Employee
from app.models.user import User
from app.schemas.leave_balance import (
    LeaveBalanceCreate,
    LeaveBalanceResponse,
)
from app.services import leave_service

router = APIRouter(prefix="/leave-balances", tags=["Leave Balances"])

LEAVE_ADMIN_ROLES = ("SUPER_ADMIN", "ORG_ADMIN", "HR")
LEAVE_MANAGEMENT_ROLES = ("SUPER_ADMIN", "ORG_ADMIN", "HR", "MANAGER")


@router.get("", response_model=list[LeaveBalanceResponse], summary="List employee leave balances across the organization")
def list_leave_balances(
    employee_id: UUID | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*LEAVE_MANAGEMENT_ROLES)),
):
    return leave_service.list_leave_balances(
        db=db,
        organization_id=current_user.organization_id,
        employee_id=employee_id,
        year=year,
    )


@router.get("/my", response_model=list[LeaveBalanceResponse], summary="Get current employee's leave balances")
def get_my_leave_balances(
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_db),  # will be overridden by auth
):
    pass


@router.get("/me", response_model=list[LeaveBalanceResponse], summary="Get current employee's leave balances")
def get_current_user_leave_balances(
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "ORG_ADMIN", "HR", "MANAGER", "EMPLOYEE")),
):
    emp = db.execute(
        select(Employee).where(
            Employee.organization_id == current_user.organization_id,
            Employee.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not emp:
        return []

    return leave_service.list_leave_balances(
        db=db,
        organization_id=current_user.organization_id,
        employee_id=emp.id,
        year=year,
    )


@router.post("", response_model=LeaveBalanceResponse, status_code=status.HTTP_201_CREATED, summary="Allocate or set employee leave balance")
def allocate_leave_balance(
    payload: LeaveBalanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*LEAVE_ADMIN_ROLES)),
):
    return leave_service.allocate_leave_balance(db, current_user.organization_id, payload)
