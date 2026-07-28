"""Pydantic v2 schemas for Autenticación, Usuarios y Configuración Inicial."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator


# ─── Usuario ──────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_completo: str
    email: str
    rol: str  # nombre del rol, no el objeto ORM
    activo: bool
    fecha_creacion: Optional[datetime] = None
    ultimo_acceso: Optional[datetime] = None

    @field_validator("rol", mode="before")
    @classmethod
    def extract_rol_name(cls, v):
        if hasattr(v, "nombre"):
            return v.nombre
        return str(v)


class UserCreateRequest(BaseModel):
    nombre_completo: str = Field(..., min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    rol: str = Field(..., pattern="^(administrador|vendedor|almacen)$")


class UserUpdateRequest(BaseModel):
    nombre_completo: Optional[str] = Field(None, min_length=1, max_length=150)
    email: Optional[EmailStr] = None
    rol: Optional[str] = Field(None, pattern="^(administrador|vendedor|almacen)$")


# ─── Autenticación ────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember: bool = False


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int
    usuario: UserOut


class LogoutResponse(BaseModel):
    mensaje: str


# ─── Setup ────────────────────────────────────────────────────────────────────

class SetupStatusResponse(BaseModel):
    setup_completed: bool
    admin_exists: bool


class SetupRequest(BaseModel):
    nombre_completo: str = Field(..., min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    negocio_nombre: str = Field(..., min_length=1, max_length=200)
    negocio_direccion: str = Field(..., min_length=1)
    negocio_rfc: str = Field(..., min_length=1, max_length=20)
    negocio_telefono: Optional[str] = None


class SetupResponse(BaseModel):
    mensaje: str
    usuario: UserOut


# ─── Preferencias ─────────────────────────────────────────────────────────────

class PreferenciasOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    idioma: str = "es"
    tema_visual: str = "light"
    zona_horaria: str = "America/Mexico_City"

    @field_validator("idioma", mode="before")
    @classmethod
    def extract_idioma(cls, v):
        return v if isinstance(v, str) else str(v)

    @field_validator("tema_visual", mode="before")
    @classmethod
    def extract_tema(cls, v):
        return v if isinstance(v, str) else str(v)


class PreferenciasUpdateRequest(BaseModel):
    idioma: Optional[str] = None
    tema_visual: Optional[str] = None
    zona_horaria: Optional[str] = None


# ─── Recuperación de Contraseña ───────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    mensaje: str


class VerifyTokenResponse(BaseModel):
    valido: bool
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


class ResetPasswordResponse(BaseModel):
    mensaje: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


class ChangePasswordResponse(BaseModel):
    mensaje: str


# ─── Respuestas Genéricas ─────────────────────────────────────────────────────

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
