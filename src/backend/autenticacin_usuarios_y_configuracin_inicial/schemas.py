from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ─── Usuario ────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_completo: str
    email: str
    rol: str
    activo: bool
    fecha_creacion: datetime
    ultimo_acceso: Optional[datetime] = None

    @field_validator("rol", mode="before")
    @classmethod
    def extract_rol_name(cls, v):
        if hasattr(v, "nombre"):
            return v.nombre
        return str(v)

    @field_validator("fecha_creacion", mode="before")
    @classmethod
    def ensure_datetime(cls, v):
        if isinstance(v, str):
            return datetime.fromisoformat(v)
        return v

    @field_validator("ultimo_acceso", mode="before")
    @classmethod
    def ensure_optional_datetime(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            return datetime.fromisoformat(v)
        return v


class UserCreateRequest(BaseModel):
    nombre_completo: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6)
    rol: str = Field(..., min_length=1)


class UserUpdateRequest(BaseModel):
    nombre_completo: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    rol: Optional[str] = None


# ─── Autenticación ──────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    remember: bool = False


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int
    usuario: UserOut


# ─── Setup ──────────────────────────────────────────────────────────────────

class SetupRequest(BaseModel):
    nombre_completo: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6)
    negocio_nombre: str = Field(..., min_length=1)
    negocio_direccion: str = Field(..., min_length=1)
    negocio_rfc: str = Field(..., min_length=1)
    negocio_telefono: Optional[str] = None


class SetupResponse(BaseModel):
    mensaje: str
    usuario: UserOut


class SetupStatusResponse(BaseModel):
    setup_completed: bool
    admin_exists: bool


# ─── Preferencias ───────────────────────────────────────────────────────────

class PreferenciasOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    idioma: str = "es"
    tema_visual: str = "light"
    zona_horaria: str = "America/Mexico_City"


class PreferenciasUpdateRequest(BaseModel):
    idioma: Optional[str] = None
    tema_visual: Optional[str] = None
    zona_horaria: Optional[str] = None


# ─── Recuperación de Contraseña ─────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=1)


class ForgotPasswordResponse(BaseModel):
    mensaje: str


class VerifyTokenResponse(BaseModel):
    valido: bool
    email: str


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


class ResetPasswordResponse(BaseModel):
    mensaje: str


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


class ChangePasswordResponse(BaseModel):
    mensaje: str


# ─── Respuestas Genéricas ───────────────────────────────────────────────────

class PaginatedUsersResponse(BaseModel):
    items: list[UserOut]
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


class LogoutResponse(BaseModel):
    mensaje: str
