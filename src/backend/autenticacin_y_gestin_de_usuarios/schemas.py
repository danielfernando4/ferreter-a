from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from typing import Optional


# --- Setup ---
class SetupRequest(BaseModel):
    full_name: str
    username: str
    email: str
    password: str


class SetupResponse(BaseModel):
    message: str


# --- Auth ---
class LoginRequest(BaseModel):
    username: str
    password: str


class UserMeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime


class LoginResponse(BaseModel):
    token: str
    user: UserMeResponse


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class SessionCheckResponse(BaseModel):
    active: bool
    expires_at: Optional[datetime] = None


class SessionExtendResponse(BaseModel):
    message: str
    expires_at: datetime


# --- Admin Users ---
class CreateUserRequest(BaseModel):
    full_name: str
    username: str
    email: str
    password: str
    role: str

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = {"administrador", "bodega", "vendedor", "compras"}
        if v.lower() not in allowed:
            raise ValueError(f"Rol inválido. Debe ser uno de: {', '.join(allowed)}")
        return v.lower()


class UpdateUserRequest(BaseModel):
    full_name: str
    email: str
    role: str
    is_active: bool

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = {"administrador", "bodega", "vendedor", "compras"}
        if v.lower() not in allowed:
            raise ValueError(f"Rol inválido. Debe ser uno de: {', '.join(allowed)}")
        return v.lower()


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime


class MessageResponse(BaseModel):
    message: str


# --- Setup status ---
class SetupStatusResponse(BaseModel):
    setup_required: bool
