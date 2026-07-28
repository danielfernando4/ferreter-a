from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ─── Rol ───────────────────────────────────────────────
class RolOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str


# ─── Usuario ───────────────────────────────────────────
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
        return v.nombre if hasattr(v, "nombre") else str(v)


class UserCreateRequest(BaseModel):
    nombre_completo: str = Field(..., min_length=1, max_length=150)
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)
    rol: str = Field(..., min_length=1)

    _validate_email = field_validator("email")(lambda v: v.strip().lower() if v else v)


class UserUpdateRequest(BaseModel):
    nombre_completo: Optional[str] = Field(None, min_length=1, max_length=150)
    email: Optional[str] = Field(None, min_length=1)
    rol: Optional[str] = Field(None, min_length=1)


# ─── Autenticación ─────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str
    remember: bool = False


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int
    usuario: UserOut


class LogoutResponse(BaseModel):
    mensaje: str


# ─── Setup ─────────────────────────────────────────────
class SetupRequest(BaseModel):
    nombre_completo: str = Field(..., min_length=1, max_length=150)
    email: str = Field(..., min_length=1)
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


# ─── Preferencias ──────────────────────────────────────
class PreferenciasOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    idioma: str = "es"
    tema_visual: str = "light"
    zona_horaria: str = "America/Mexico_City"


class PreferenciasUpdateRequest(BaseModel):
    idioma: Optional[str] = None
    tema_visual: Optional[str] = None
    zona_horaria: Optional[str] = None


# ─── Recuperación de Contraseña ───────────────────────
class ForgotPasswordRequest(BaseModel):
    email: str


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


# ─── Respuestas Genéricas ──────────────────────────────
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
