from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import get_current_user
from app.core.rate_limit import enforce_login_rate_limit, get_rate_limit_store
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models import Employee, Organization, Role, User
from app.schemas.auth import LoginRequest, TokenResponse, UserMeResponse


router = APIRouter(prefix="/auth", tags=["Authentication"])

# Pre-computed dummy bcrypt hash to mitigate timing side-channel attacks for email enumeration
_DUMMY_HASH = get_password_hash("mitigate_timing_enumeration_constant_time")


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Authenticate user with email/password and issue JWT token.
    Enforces IP-based and email-based rate limiting against brute-force abuse.
    Mitigates user enumeration timing attacks via constant-time verification.
    """
    # 1. Enforce rate limiting before processing credentials
    enforce_login_rate_limit(request=request, email=payload.email)

    generic_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    stmt = select(User).where(User.email == payload.email.lower().strip())
    user = db.execute(stmt).scalar_one_or_none()

    if not user:
        # Perform dummy bcrypt check to normalize response latency
        verify_password(payload.password, _DUMMY_HASH)
        raise generic_error

    if not verify_password(payload.password, user.password_hash):
        raise generic_error

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )

    # Validate active organization
    org_stmt = select(Organization).where(Organization.id == user.organization_id)
    org = db.execute(org_stmt).scalar_one_or_none()
    if not org or not org.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Organization is inactive or not found",
        )

    # Fetch role
    role_stmt = select(Role).where(Role.id == user.role_id)
    role = db.execute(role_stmt).scalar_one_or_none()
    role_name = role.name if role else "EMPLOYEE"

    # Reset rate limit counter for this email on successful authentication
    get_rate_limit_store().reset(f"login:email:{payload.email.lower().strip()}")

    # Update last login timestamp
    user.last_login_at = datetime.utcnow()
    db.commit()

    access_token = create_access_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=role_name,
        user_id=user.id,
        organization_id=user.organization_id,
    )


@router.get("/me", response_model=UserMeResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return authenticated user profile and verified role."""
    role_stmt = select(Role).where(Role.id == current_user.role_id)
    role = db.execute(role_stmt).scalar_one_or_none()
    role_name = role.name if role else "EMPLOYEE"

    return UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        organization_id=current_user.organization_id,
        role_id=current_user.role_id,
        role_name=role_name,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        last_login_at=current_user.last_login_at,
        created_at=current_user.created_at,
    )
