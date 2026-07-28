from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


# ─── Esquemas de Usuario ────────────────────────────────────────────────────

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_completo: str
    email: str
    rol: str
    activo: bool
    fecha_registro: datetime
    ultimo_acceso: Optional[datetime] = None


class UserCreateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nombre_completo: str
    email: str
    password: str
    rol: str

    @field_validator("rol")
    @classmethod
    def validate_rol(cls, v: str) -> str:
        allowed = ["administrador", "vendedor", "almacen"]
        if v.lower() not in allowed:
            raise ValueError(f"Rol inválido. Debe ser uno de: {', '.join(allowed)}")
        return v.lower()


class UserUpdateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nombre_completo: Optional[str] = None
    email: Optional[str] = None
    rol: Optional[str] = None

    @field_validator("rol")
    @classmethod
    def validate_rol(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = ["administrador", "vendedor", "almacen"]
            if v.lower() not in allowed:
                raise ValueError(f"Rol inválido. Debe ser uno de: {', '.join(allowed)}")
            return v.lower()
        return v


# ─── Esquemas de Autenticación ──────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str
    remember: bool = False


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int
    usuario: UserOut


# ─── Esquemas de Setup ──────────────────────────────────────────────────────

class SetupRequest(BaseModel):
    nombre_completo: str
    email: str
    password: str
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


# ─── Esquemas de Preferencias ───────────────────────────────────────────────

class PreferenciasOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    idioma: str = "es"
    tema_visual: str = "light"
    zona_horaria: str = "America/Mexico_City"


class PreferenciasUpdateRequest(BaseModel):
    idioma: Optional[str] = None
    tema_visual: Optional[str] = None
    zona_horaria: Optional[str] = None


# ─── Esquemas de Recuperación de Contraseña ─────────────────────────────────

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


# ─── Esquemas de Respuesta Genéricos ────────────────────────────────────────

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
