from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime


# ─── Enums / Constants ────────────────────────────────────────────

ROLES_VALIDOS = ["administrador", "vendedor", "almacen"]


# ─── Esquemas de Usuario ──────────────────────────────────────────

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_completo: str
    email: str
    rol: str
    activo: bool
    fecha_registro: datetime = Field(validation_alias="fecha_creacion")
    ultimo_acceso: Optional[datetime] = None

    @field_validator("rol", mode="before")
    @classmethod
    def extract_rol_name(cls, v):
        if hasattr(v, "nombre"):
            return v.nombre
        return str(v)

    @field_validator("fecha_registro", mode="before")
    @classmethod
    def validate_fecha_registro(cls, v):
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


# ─── Esquemas de Autenticación ────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str
    remember: bool = False


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int
    usuario: UserOut


# ─── Esquemas de Setup ─────────────────────────────────────────────

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


# ─── Esquemas de Preferencias ──────────────────────────────────────

class PreferenciasOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    idioma: str = "es"
    tema_visual: str = "light"
    zona_horaria: str = "America/Mexico_City"

    @field_validator("zona_horaria", mode="before")
    @classmethod
    def map_configuracion_regional(cls, v):
        """Mapea configuracion_regional del modelo a zona_horaria del schema."""
        return v


class PreferenciasUpdateRequest(BaseModel):
    idioma: Optional[str] = None
    tema_visual: Optional[str] = None
    zona_horaria: Optional[str] = None


# ─── Esquemas de Recuperación ──────────────────────────────────────

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


# ─── Esquemas de Respuesta Genéricos ───────────────────────────────

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
