from __future__ import annotations

from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.permissions import require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.leave_policy import (
    LeavePolicyCreate,
    LeavePolicyResponse,
    LeavePolicyUpdate,
)
from app.services import leave_service

router = APIRouter(prefix="/leave-policies", tags=["Leave Policies"])

LEAVE_ADMIN_ROLES = ("SUPER_ADMIN", "ORG_ADMIN", "HR")
LEAVE_VIEW_ROLES = ("SUPER_ADMIN", "ORG_ADMIN", "HR", "MANAGER", "EMPLOYEE")


@router.get("", response_model=list[LeavePolicyResponse], summary="List all organization leave policies")
def list_leave_policies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*LEAVE_VIEW_ROLES)),
):
    return leave_service.list_leave_policies(db, current_user.organization_id)


@router.post("", response_model=LeavePolicyResponse, status_code=status.HTTP_201_CREATED, summary="Create or update a leave policy")
def create_or_update_leave_policy(
    payload: LeavePolicyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*LEAVE_ADMIN_ROLES)),
):
    return leave_service.create_or_update_leave_policy(db, current_user.organization_id, payload)
