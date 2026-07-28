from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from autenticacin_usuarios_y_configuracin_inicial.schemas import (
    SetupRequest, SetupResponse, SetupStatusResponse,
    LoginRequest, LoginResponse, LogoutResponse,
    ForgotPasswordRequest, ForgotPasswordResponse,
    VerifyTokenResponse,
    ResetPasswordRequest, ResetPasswordResponse,
    ChangePasswordRequest, ChangePasswordResponse,
    UserCreateRequest, UserUpdateRequest, UserOut,
    PaginatedUsersResponse, UserActionResponse,
    PerfilResponse, PreferenciasOut, PreferenciasUpdateRequest,
)
from autenticacin_usuarios_y_configuracin_inicial.dependencies import get_current_user, require_admin
from autenticacin_usuarios_y_configuracin_inicial import service

router = APIRouter()
_security = HTTPBearer(auto_error=False)


# =====================
# Rutas Públicas
# =====================


@router.get("/api/auth/check-setup", response_model=SetupStatusResponse)
async def check_setup(db: AsyncSession = Depends(get_db)):
    """Check if initial setup has been completed."""
    result = await service.check_setup_status(db)
    return result


@router.post("/api/auth/setup", response_model=SetupResponse)
async def run_setup(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Execute initial setup wizard - creates admin user and business config."""
    try:
        mensaje, user = await service.run_setup(db, data)
        return SetupResponse(
            mensaje=mensaje,
            usuario=UserOut(
                id=user.id,
                nombre_completo=user.nombre_completo,
                email=user.email,
                rol=user.rol.nombre if user.rol else "administrador",
                activo=user.activo,
                fecha_registro=user.fecha_creacion,
                ultimo_acceso=user.ultimo_acceso,
            ),
        )
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "SETUP_ALREADY_COMPLETED":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SETUP_ALREADY_COMPLETED")
        if error_msg == "EMAIL_EXISTS":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="EMAIL_EXISTS")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_DATA")


@router.post("/api/auth/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT token."""
    try:
        result = await service.authenticate_user(db, data.email, data.password, data.remember)
        return LoginResponse(**result)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="INVALID_CREDENTIALS")


@router.post("/api/auth/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request password reset email."""
    result = await service.forgot_password(db, data.email)
    return ForgotPasswordResponse(**result)


@router.get("/api/auth/verify-reset-token/{token}", response_model=VerifyTokenResponse)
async def verify_reset_token(token: str, db: AsyncSession = Depends(get_db)):
    """Verify if a reset token is valid."""
    result = await service.verify_reset_token(db, token)
    return VerifyTokenResponse(**result)


@router.post("/api/auth/reset-password", response_model=ResetPasswordResponse)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid reset token."""
    try:
        result = await service.reset_password(db, data.token, data.new_password, data.confirm_password)
        return ResetPasswordResponse(**result)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "PASSWORDS_DONT_MATCH":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PASSWORDS_DONT_MATCH")
        if error_msg == "TOKEN_INVALID_OR_EXPIRED":
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="TOKEN_INVALID_OR_EXPIRED")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_DATA")


# =====================
# Rutas Protegidas - Auth
# =====================


@router.get("/api/auth/me", response_model=UserOut)
async def get_me(current_user: "Usuario" = Depends(get_current_user)):  # noqa: F821
    """Get current authenticated user profile."""
    return UserOut(
        id=current_user.id,
        nombre_completo=current_user.nombre_completo,
        email=current_user.email,
        rol=current_user.rol.nombre if current_user.rol else "desconocido",
        activo=current_user.activo,
        fecha_registro=current_user.fecha_creacion,
        ultimo_acceso=current_user.ultimo_acceso,
    )


@router.post("/api/auth/logout", response_model=LogoutResponse)
async def logout(
    credentials: Optional["HTTPAuthorizationCredentials"] = Depends(_security),  # noqa: F821
    db: AsyncSession = Depends(get_db),
    current_user: "Usuario" = Depends(get_current_user),  # noqa: F821
):
    """Logout by invalidating the current session token."""
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="UNAUTHORIZED")
    try:
        await service.logout_user(db, credentials.credentials)
        return LogoutResponse(mensaje="Sesión cerrada exitosamente.")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="UNAUTHORIZED")


# =====================
# Rutas Protegidas - Usuarios (Admin only)
# =====================


@router.get("/api/usuarios", response_model=PaginatedUsersResponse)
async def list_usuarios(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: "Usuario" = Depends(require_admin),  # noqa: F821
):
    """List all users with pagination and optional search."""
    result = await service.list_usuarios(db, search, page, page_size)
    return PaginatedUsersResponse(**result)


@router.get("/api/usuarios/{user_id}", response_model=UserOut)
async def get_usuario(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: "Usuario" = Depends(require_admin),  # noqa: F821
):
    """Get a single user by ID."""
    try:
        user = await service.get_usuario(db, user_id)
        return UserOut(
            id=user.id,
            nombre_completo=user.nombre_completo,
            email=user.email,
            rol=user.rol.nombre if user.rol else "desconocido",
            activo=user.activo,
            fecha_registro=user.fecha_creacion,
            ultimo_acceso=user.ultimo_acceso,
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")


@router.post("/api/usuarios", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_usuario(
    data: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: "Usuario" = Depends(require_admin),  # noqa: F821
):
    """Create a new user."""
    try:
        user = await service.create_usuario(db, data)
        return UserOut(
            id=user.id,
            nombre_completo=user.nombre_completo,
            email=user.email,
            rol=user.rol.nombre if user.rol else data.rol,
            activo=user.activo,
            fecha_registro=user.fecha_creacion,
            ultimo_acceso=user.ultimo_acceso,
        )
    except ValueError as e:
        err = str(e)
        if err == "EMAIL_EXISTS":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_EXISTS")
        if err == "INVALID_ROLE":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_DATA")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_DATA")


@router.put("/api/usuarios/{user_id}", response_model=UserOut)
async def update_usuario(
    user_id: int,
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: "Usuario" = Depends(require_admin),  # noqa: F821
):
    """Update an existing user (name, email, role)."""
    try:
        user = await service.update_usuario(db, user_id, data)
        return UserOut(
            id=user.id,
            nombre_completo=user.nombre_completo,
            email=user.email,
            rol=user.rol.nombre if user.rol else "desconocido",
            activo=user.activo,
            fecha_registro=user.fecha_creacion,
            ultimo_acceso=user.ultimo_acceso,
        )
    except ValueError as e:
        err = str(e)
        if err == "NOT_FOUND":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")
        if err == "EMAIL_EXISTS":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_EXISTS")
        if err == "INVALID_ROLE":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_DATA")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_DATA")


@router.patch("/api/usuarios/{user_id}/deactivate", response_model=UserActionResponse)
async def deactivate_usuario(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: "Usuario" = Depends(require_admin),  # noqa: F821
):
    """Deactivate a user (cannot deactivate self)."""
    try:
        user = await service.deactivate_usuario(db, user_id, current_user.id)
        return UserActionResponse(
            mensaje="Usuario desactivado exitosamente.",
            usuario=UserOut(
                id=user.id,
                nombre_completo=user.nombre_completo,
                email=user.email,
                rol=user.rol.nombre if user.rol else "desconocido",
                activo=user.activo,
                fecha_registro=user.fecha_creacion,
                ultimo_acceso=user.ultimo_acceso,
            ),
        )
    except ValueError as e:
        err = str(e)
        if err == "NOT_FOUND":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")
        if err == "CANNOT_DEACTIVATE_SELF":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CANNOT_DEACTIVATE_SELF")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_DATA")


@router.patch("/api/usuarios/{user_id}/reactivate", response_model=UserActionResponse)
async def reactivate_usuario(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: "Usuario" = Depends(require_admin),  # noqa: F821
):
    """Reactivate a deactivated user."""
    try:
        user = await service.reactivate_usuario(db, user_id)
        return UserActionResponse(
            mensaje="Usuario reactivado exitosamente.",
            usuario=UserOut(
                id=user.id,
                nombre_completo=user.nombre_completo,
                email=user.email,
                rol=user.rol.nombre if user.rol else "desconocido",
                activo=user.activo,
                fecha_registro=user.fecha_creacion,
                ultimo_acceso=user.ultimo_acceso,
            ),
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")


# =====================
# Rutas Protegidas - Perfil
# =====================


@router.get("/api/perfil", response_model=PerfilResponse)
async def get_perfil(
    db: AsyncSession = Depends(get_db),
    current_user: "Usuario" = Depends(get_current_user),  # noqa: F821
):
    """Get current user's profile and preferences."""
    try:
        result = await service.get_perfil(db, current_user.id)
        return PerfilResponse(**result)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")


@router.put("/api/perfil", response_model=UserOut)
async def update_perfil(
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: "Usuario" = Depends(get_current_user),  # noqa: F821
):
    """Update current user's profile (name, email)."""
    try:
        user = await service.update_perfil(db, current_user.id, data)
        return UserOut(
            id=user.id,
            nombre_completo=user.nombre_completo,
            email=user.email,
            rol=user.rol.nombre if user.rol else "desconocido",
            activo=user.activo,
            fecha_registro=user.fecha_creacion,
            ultimo_acceso=user.ultimo_acceso,
        )
    except ValueError as e:
        err = str(e)
        if err == "EMAIL_EXISTS":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_EXISTS")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_DATA")


@router.put("/api/perfil/cambiar-password", response_model=ChangePasswordResponse)
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: "Usuario" = Depends(get_current_user),  # noqa: F821
):
    """Change current user's password."""
    try:
        result = await service.change_password(
            db, current_user.id, data.current_password, data.new_password, data.confirm_password
        )
        return ChangePasswordResponse(**result)
    except ValueError as e:
        err = str(e)
        if err == "INVALID_CURRENT_PASSWORD":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_CURRENT_PASSWORD")
        if err == "PASSWORDS_DONT_MATCH":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PASSWORDS_DONT_MATCH")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_DATA")


@router.get("/api/perfil/preferencias", response_model=PreferenciasOut)
async def get_preferencias(
    db: AsyncSession = Depends(get_db),
    current_user: "Usuario" = Depends(get_current_user),  # noqa: F821
):
    """Get current user's preferences."""
    prefs = await service.get_preferencias(db, current_user.id)
    return PreferenciasOut(
        idioma=prefs.idioma,
        tema_visual=prefs.tema_visual,
        zona_horaria=prefs.zona_horaria,
    )


@router.put("/api/perfil/preferencias", response_model=PreferenciasOut)
async def update_preferencias(
    data: PreferenciasUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: "Usuario" = Depends(get_current_user),  # noqa: F821
):
    """Update current user's preferences."""
    prefs = await service.update_preferencias(db, current_user.id, data)
    return PreferenciasOut(
        idioma=prefs.idioma,
        tema_visual=prefs.tema_visual,
        zona_horaria=prefs.zona_horaria,
    )
