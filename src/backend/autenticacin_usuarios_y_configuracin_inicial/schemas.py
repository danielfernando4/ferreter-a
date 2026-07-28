from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ─── Esquemas de Usuario ───────────────────────────────────────────────

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_completo: str
    email: str
    rol: str
    activo: bool
    fecha_registro: datetime = Field(alias="fecha_creacion")
    ultimo_acceso: Optional[datetime] = None

    @field_validator("rol", mode="before")
    @classmethod
    def extract_rol_name(cls, v):
        return v.nombre if hasattr(v, "nombre") else str(v)

    @field_validator("fecha_registro", mode="before")
    @classmethod
    def handle_fecha_creacion(cls, v):
        return v


class UserCreateRequest(BaseModel):
    nombre_completo: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    rol: str


class UserUpdateRequest(BaseModel):
    nombre_completo: Optional[str] = None
    email: Optional[EmailStr] = None
    rol: Optional[str] = None


# ─── Esquemas de Autenticación ──────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str
    remember: bool = False


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int
    usuario: UserOut


# ─── Esquemas de Setup ──────────────────────────────────────────────────

class SetupRequest(BaseModel):
    nombre_completo: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    negocio_nombre: str
    negocio_direccion: str
    negocio_rfc: str
    negocio_telefono: Optional[str] = None


class SetupResponse(BaseModel):
    mensaje: str
    usuario: UserOut


class SetupStatusResponse(BaseModel):
    setup_completed: bool
    admin_exists: bool


# ─── Esquemas de Preferencias ──────────────────────────────────────────

class PreferenciasOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    idioma: str = "es"
    tema_visual: str = "light"
    zona_horaria: str = Field(default="America/Mexico_City", alias="configuracion_regional")

    @field_validator("zona_horaria", mode="before")
    @classmethod
    def handle_configuracion_regional(cls, v):
        return v


class PreferenciasUpdateRequest(BaseModel):
    idioma: Optional[str] = None
    tema_visual: Optional[str] = None
    zona_horaria: Optional[str] = None


# ─── Esquemas de Recuperación ──────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: str


class ForgotPasswordResponse(BaseModel):
    mensaje: str


class VerifyTokenResponse(BaseModel):
    valido: bool
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str


class ResetPasswordResponse(BaseModel):
    mensaje: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class ChangePasswordResponse(BaseModel):
    mensaje: str


class LogoutResponse(BaseModel):
    mensaje: str


# ─── Esquemas de Respuesta Genéricos ───────────────────────────────────

class PaginatedUsersResponse(BaseModel):
    items: List[UserOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class UserActionResponse(BaseModel):
    mensaje: str
    usuario: UserOut


class PerfilResponse(BaseModel):
    usuario: UserOut
    preferencias: PreferenciasOut
