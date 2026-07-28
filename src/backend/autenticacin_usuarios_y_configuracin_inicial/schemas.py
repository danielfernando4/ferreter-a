from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ───── Esquemas de Rol ─────

class RolOut(BaseModel):
    id: int
    nombre: str
    descripcion: str

    model_config = ConfigDict(from_attributes=True)


# ───── Esquemas de Usuario ─────

class UserOut(BaseModel):
    id: int
    nombre_completo: str
    email: str
    rol: str
    activo: bool
    fecha_registro: datetime
    ultimo_acceso: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

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
        return v

    @field_validator("ultimo_acceso", mode="before")
    @classmethod
    def extract_ultimo_acceso(cls, v):
        if v is None:
            return None
        return v


class UserCreateRequest(BaseModel):
    nombre_completo: str = Field(..., min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    rol: str = Field(..., pattern="^(administrador|vendedor|almacen)$")


class UserUpdateRequest(BaseModel):
    nombre_completo: Optional[str] = Field(None, min_length=1, max_length=150)
    email: Optional[EmailStr] = None
    rol: Optional[str] = Field(None, pattern="^(administrador|vendedor|almacen)$")


# ───── Esquemas de Autenticación ─────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember: bool = False


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int
    usuario: UserOut


# ───── Esquemas de Setup ─────

class SetupStatusResponse(BaseModel):
    setup_completed: bool
    admin_exists: bool


class SetupRequest(BaseModel):
    nombre_completo: str = Field(..., min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    negocio_nombre: str = Field(..., min_length=1, max_length=200)
    negocio_direccion: str = Field(..., min_length=1, max_length=300)
    negocio_rfc: str = Field(..., min_length=1, max_length=50)
    negocio_telefono: Optional[str] = Field(None, max_length=50)


class SetupResponse(BaseModel):
    mensaje: str
    usuario: UserOut


# ───── Esquemas de Preferencias ─────

class PreferenciasOut(BaseModel):
    idioma: str = "es"
    tema_visual: str = "light"
    zona_horaria: str = "America/Mexico_City"

    model_config = ConfigDict(from_attributes=True)

    @field_validator("zona_horaria", mode="before")
    @classmethod
    def extract_zona_horaria(cls, v):
        return v or "America/Mexico_City"


class PreferenciasUpdateRequest(BaseModel):
    idioma: Optional[str] = None
    tema_visual: Optional[str] = None
    zona_horaria: Optional[str] = None


# ───── Esquemas de Recuperación ─────

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


# ───── Esquemas de Respuesta Genéricos ─────

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
