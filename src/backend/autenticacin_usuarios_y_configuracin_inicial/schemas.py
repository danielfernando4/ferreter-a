from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ────────────────────────────
# Rol schemas
# ────────────────────────────
class RolOut(BaseModel):
    id: int
    nombre: str
    descripcion: str

    model_config = ConfigDict(from_attributes=True)


# ────────────────────────────
# Usuario schemas
# ────────────────────────────
class UserOut(BaseModel):
    id: int
    nombre_completo: str
    email: str
    rol: str  # nombre del rol, no objeto
    activo: bool
    fecha_creacion: datetime
    ultimo_acceso: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

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
    rol: str  # validated against predefined roles

    model_config = ConfigDict(from_attributes=True)


class UserUpdateRequest(BaseModel):
    nombre_completo: Optional[str] = Field(None, min_length=1, max_length=150)
    email: Optional[EmailStr] = None
    rol: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ────────────────────────────
# Authentication schemas
# ────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember: bool = False


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int
    usuario: UserOut


# ────────────────────────────
# Setup schemas
# ────────────────────────────
class SetupStatusResponse(BaseModel):
    setup_completed: bool
    admin_exists: bool


class SetupRequest(BaseModel):
    nombre_completo: str = Field(..., min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    negocio_nombre: str = Field(..., min_length=1)
    negocio_direccion: str = Field(..., min_length=1)
    negocio_rfc: str = Field(..., min_length=1)
    negocio_telefono: Optional[str] = None


class SetupResponse(BaseModel):
    mensaje: str
    usuario: UserOut


# ────────────────────────────
# Preferences schemas
# ────────────────────────────
class PreferenciasOut(BaseModel):
    idioma: str = "es"
    tema_visual: str = "light"
    zona_horaria: str = "America/Mexico_City"

    model_config = ConfigDict(from_attributes=True)

    @field_validator("zona_horaria", mode="before")
    @classmethod
    def extract_zona_horaria(cls, v):
        """Map configuracion_regional to zona_horaria for frontend compatibility."""
        if v is None:
            return "America/Mexico_City"
        return v


class PreferenciasUpdateRequest(BaseModel):
    idioma: Optional[str] = None
    tema_visual: Optional[str] = None
    zona_horaria: Optional[str] = None


# ────────────────────────────
# Password recovery schemas
# ────────────────────────────
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


# ────────────────────────────
# Generic response schemas
# ────────────────────────────
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


class LogoutResponse(BaseModel):
    mensaje: str
