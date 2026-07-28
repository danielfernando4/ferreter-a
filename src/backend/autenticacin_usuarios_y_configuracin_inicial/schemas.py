from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ─── Enumeración de roles ───────────────────────────────────────────────
ROLES_VALIDOS = ["administrador", "vendedor", "almacen"]


# ─── Esquemas de Usuario ────────────────────────────────────────────────
class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_completo: str
    email: str
    rol: str
    activo: bool
    fecha_registro: datetime
    ultimo_acceso: Optional[datetime] = None

    @field_validator("rol", mode="before")
    @classmethod
    def extract_rol_name(cls, v):
        if hasattr(v, "nombre"):
            return v.nombre
        return str(v)

    @field_validator("fecha_registro", mode="before")
    @classmethod
    def extract_fecha_registro(cls, v):
        if v is None:
            return v
        if hasattr(v, "isoformat"):
            return v
        return v


class UserCreateRequest(BaseModel):
    nombre_completo: str = Field(..., min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    rol: str

    @field_validator("rol")
    @classmethod
    def validate_rol(cls, v):
        if v not in ROLES_VALIDOS:
            raise ValueError(f"Rol inválido. Debe ser uno de: {', '.join(ROLES_VALIDOS)}")
        return v


class UserUpdateRequest(BaseModel):
    nombre_completo: Optional[str] = Field(None, min_length=1, max_length=150)
    email: Optional[EmailStr] = None
    rol: Optional[str] = None

    @field_validator("rol")
    @classmethod
    def validate_rol(cls, v):
        if v is not None and v not in ROLES_VALIDOS:
            raise ValueError(f"Rol inválido. Debe ser uno de: {', '.join(ROLES_VALIDOS)}")
        return v


# ─── Esquemas de Autenticación ──────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember: bool = False


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int
    usuario: UserOut


# ─── Esquemas de Setup ─────────────────────────────────────────────────
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


class SetupStatusResponse(BaseModel):
    setup_completed: bool
    admin_exists: bool


# ─── Esquemas de Preferencias ──────────────────────────────────────────
class PreferenciasOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    idioma: str = "es"
    tema_visual: str = "light"
    zona_horaria: str = "America/Mexico_City"

    @field_validator("zona_horaria", mode="before")
    @classmethod
    def map_configuracion_regional(cls, v):
        # Map from configuracion_regional to zona_horaria for schema compat
        if v and v == "es-MX":
            return "America/Mexico_City"
        return v if v else "America/Mexico_City"


class PreferenciasUpdateRequest(BaseModel):
    idioma: Optional[str] = None
    tema_visual: Optional[str] = None
    zona_horaria: Optional[str] = None


# ─── Esquemas de Recuperación ──────────────────────────────────────────
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


class LogoutResponse(BaseModel):
    mensaje: str
