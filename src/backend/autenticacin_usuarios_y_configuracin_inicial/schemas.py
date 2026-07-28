from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- Esquemas de Usuario ---

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_completo: str
    email: str
    rol: str
    activo: bool
    fecha_registro: datetime
    ultimo_acceso: Optional[datetime] = None

    @classmethod
    def _extract_rol(cls, v):
        return v.nombre if hasattr(v, "nombre") else str(v)


class UserCreateRequest(BaseModel):
    nombre_completo: str = Field(..., min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    rol: str = Field(..., min_length=1)


class UserUpdateRequest(BaseModel):
    nombre_completo: Optional[str] = Field(None, min_length=1, max_length=150)
    email: Optional[EmailStr] = None
    rol: Optional[str] = None


# --- Esquemas de Autenticación ---

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)
    remember: bool = False


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int
    usuario: UserOut


# --- Esquemas de Setup ---

class SetupRequest(BaseModel):
    nombre_completo: str = Field(..., min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    negocio_nombre: str = Field(..., min_length=1, max_length=200)
    negocio_direccion: str = Field(..., min_length=1)
    negocio_rfc: str = Field(..., min_length=1, max_length=50)
    negocio_telefono: Optional[str] = Field(None, max_length=20)


class SetupResponse(BaseModel):
    mensaje: str
    usuario: UserOut


# --- Esquemas de Preferencias ---

class PreferenciasOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    idioma: str = "es"
    tema_visual: str = "light"
    zona_horaria: str = "America/Mexico_City"


class PreferenciasUpdateRequest(BaseModel):
    idioma: Optional[str] = None
    tema_visual: Optional[str] = None
    zona_horaria: Optional[str] = None


# --- Esquemas de Recuperación ---

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


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


# --- Esquemas de Respuesta Genéricos ---

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


class SetupStatusResponse(BaseModel):
    setup_completed: bool
    admin_exists: bool
