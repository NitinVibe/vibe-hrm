from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: UUID
    organization_id: UUID


class UserMeResponse(BaseModel):
    id: UUID
    email: str
    organization_id: UUID
    role_id: UUID
    role_name: str
    is_active: bool
    is_verified: bool
    last_login_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True
