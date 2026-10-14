from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import Employee, Organization, Role, User


security_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_bearer),
    db: Session = Depends(get_db),
) -> User:
    """Validate JWT token, verify active user & organization from database, and return User."""
    unauthorized_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise unauthorized_exception

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise unauthorized_exception

    try:
        user_uuid = UUID(user_id_str)
    except (ValueError, TypeError):
        raise unauthorized_exception

    # Query the user from PostgreSQL on every request
    stmt = (
        select(User)
        .where(User.id == user_uuid)
    )
    user = db.execute(stmt).scalar_one_or_none()

    if not user:
        raise unauthorized_exception

    # Reject inactive users
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )

    # Validate that the associated organization is active
    org_stmt = select(Organization).where(Organization.id == user.organization_id)
    org = db.execute(org_stmt).scalar_one_or_none()
    if not org or not org.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Organization is inactive or not found",
        )

    return user


EMPLOYEE_READ_ROLES = ("SUPER_ADMIN", "ORG_ADMIN", "HR", "MANAGER")
EMPLOYEE_WRITE_ROLES = ("SUPER_ADMIN", "ORG_ADMIN", "HR")
SHIFT_READ_ROLES = ("SUPER_ADMIN", "ORG_ADMIN", "HR", "MANAGER")
SHIFT_WRITE_ROLES = ("SUPER_ADMIN", "ORG_ADMIN", "HR")
ATTENDANCE_READ_ROLES = ("SUPER_ADMIN", "ORG_ADMIN", "HR", "MANAGER")
ATTENDANCE_WRITE_ROLES = ("SUPER_ADMIN", "ORG_ADMIN", "HR")


def require_roles(*allowed_roles: str):
    """
    Dependency that enforces database-verified role authorization.
    Resolves the user's role directly from the database to prevent client role spoofing.
    """
    def role_dependency(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        stmt = select(Role).where(Role.id == current_user.role_id)
        role = db.execute(stmt).scalar_one_or_none()
        role_name = role.name if role else None

        if not role_name or role_name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to perform this action",
            )
        return current_user

    return role_dependency
