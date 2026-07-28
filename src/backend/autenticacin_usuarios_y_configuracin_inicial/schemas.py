from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


# ─── Usuario ─────────────────────────────────────────────────────────────────

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


class UserCreateRequest(BaseModel):
    nombre_completo: str
    email: EmailStr
    password: str
    rol: str


class UserUpdateRequest(BaseModel):
    nombre_completo: Optional[str] = None
    email: Optional[EmailStr] = None
    rol: Optional[str] = None


# ─── Autenticación ───────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str
    remember: bool = False


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int
    usuario: UserOut


# ─── Setup ───────────────────────────────────────────────────────────────────

class SetupRequest(BaseModel):
    nombre_completo: str
    email: EmailStr
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


# ─── Preferencias ────────────────────────────────────────────────────────────

class PreferenciasOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    idioma: str = "es"
    tema_visual: str = "light"
    zona_horaria: str = "America/Mexico_City"


class PreferenciasUpdateRequest(BaseModel):
    idioma: Optional[str] = None
    tema_visual: Optional[str] = None
    zona_horaria: Optional[str] = None


# ─── Recuperación de Contraseña ──────────────────────────────────────────────

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


# ─── Respuestas Genéricas ────────────────────────────────────────────────────

class PaginatedUsersResponse(BaseModel):
    items: List[UserOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class UserActionResponse(BaseModel):
    mensaje: str
    usuario: UserOut


class LogoutResponse(BaseModel):
    mensaje: str


class PerfilResponse(BaseModel):
    usuario: UserOut
    preferencias: PreferenciasOut
