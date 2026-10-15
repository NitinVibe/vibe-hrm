from __future__ import annotations

from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.permissions import require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.leave_type import (
    LeaveTypeCreate,
    LeaveTypeResponse,
    LeaveTypeUpdate,
)
from app.services import leave_service

router = APIRouter(prefix="/leave-types", tags=["Leave Types"])

LEAVE_ADMIN_ROLES = ("SUPER_ADMIN", "ORG_ADMIN", "HR")
LEAVE_VIEW_ROLES = ("SUPER_ADMIN", "ORG_ADMIN", "HR", "MANAGER", "EMPLOYEE")


@router.get("", response_model=list[LeaveTypeResponse], summary="List all organization leave types")
def list_leave_types(
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*LEAVE_VIEW_ROLES)),
):
    return leave_service.list_leave_types(db, current_user.organization_id, active_only=active_only)


@router.post("", response_model=LeaveTypeResponse, status_code=status.HTTP_201_CREATED, summary="Create a new leave type")
def create_leave_type(
    payload: LeaveTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*LEAVE_ADMIN_ROLES)),
):
    return leave_service.create_leave_type(db, current_user.organization_id, payload)


@router.get("/{leave_type_id}", response_model=LeaveTypeResponse, summary="Get details of a leave type")
def get_leave_type(
    leave_type_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*LEAVE_VIEW_ROLES)),
):
    item = leave_service.get_leave_type(db, current_user.organization_id, leave_type_id)
    if not item:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave type not found")
    return item


@router.patch("/{leave_type_id}", response_model=LeaveTypeResponse, summary="Update an existing leave type")
def update_leave_type(
    leave_type_id: UUID,
    payload: LeaveTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*LEAVE_ADMIN_ROLES)),
):
    return leave_service.update_leave_type(db, current_user.organization_id, leave_type_id, payload)
