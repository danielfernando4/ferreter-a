from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- Setup schemas ---
class SetupRequest(BaseModel):
    full_name: str = Field(..., min_length=1)
    username: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class SetupResponse(BaseModel):
    message: str


class SetupStatusResponse(BaseModel):
    setup_required: bool


# --- Auth schemas ---
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class UserBrief(BaseModel):
    id: str
    full_name: str
    username: str
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    token: str
    user: UserBrief


class LogoutResponse(BaseModel):
    message: str


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=1)
    confirm_password: str = Field(..., min_length=1)


class ChangePasswordResponse(BaseModel):
    message: str


# --- Session schemas ---
class SessionCheckResponse(BaseModel):
    active: bool
    expires_at: str


class SessionExtendResponse(BaseModel):
    message: str
    expires_at: str


# --- User management schemas ---
class UserResponse(BaseModel):
    id: str
    full_name: str
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreateUserRequest(BaseModel):
    full_name: str = Field(..., min_length=1)
    username: str = Field(..., min_length=3)
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=8)
    role: str = Field(..., pattern="^(administrador|bodega|vendedor|compras)$")


class UpdateUserRequest(BaseModel):
    full_name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    role: str = Field(..., pattern="^(administrador|bodega|vendedor|compras)$")
    is_active: bool


class DeleteUserResponse(BaseModel):
    message: str
