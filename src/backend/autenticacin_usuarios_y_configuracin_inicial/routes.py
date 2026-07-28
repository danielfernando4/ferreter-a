from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from .schemas import (
    SetupRequest, SetupResponse, SetupStatusResponse,
    LoginRequest, LoginResponse,
    ForgotPasswordRequest, ForgotPasswordResponse,
    VerifyTokenResponse, ResetPasswordRequest, ResetPasswordResponse,
    UserOut, UserCreateRequest, UserUpdateRequest,
    PaginatedUsersResponse, UserActionResponse,
    PerfilResponse, PreferenciasOut, PreferenciasUpdateRequest,
    ChangePasswordRequest, ChangePasswordResponse,
    LogoutResponse,
)
from .dependencies import get_current_user, require_admin
from .models import Usuario
from . import service

router = APIRouter(tags=["Autenticación, Usuarios y Configuración Inicial"])


# ═══════════════════════════════════════════════════════════
# ENDPOINTS PÚBLICOS
# ═══════════════════════════════════════════════════════════

@router.get("/auth/check-setup", response_model=SetupStatusResponse)
async def check_setup(db: AsyncSession = Depends(get_db)):
    """Check if the setup wizard has been completed."""
    return await service.check_setup_status(db)


@router.post("/auth/setup", response_model=SetupResponse, status_code=201)
async def run_setup(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Execute the initial setup wizard."""
    return await service.run_setup(db, data)


@router.post("/auth/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return session token."""
    return await service.login(db, data.email, data.password, data.remember)


@router.post("/auth/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset email."""
    return await service.forgot_password(db, data.email)


@router.get("/auth/verify-reset-token/{token}", response_model=VerifyTokenResponse)
async def verify_reset_token(token: str, db: AsyncSession = Depends(get_db)):
    """Verify if a reset token is still valid."""
    return await service.verify_reset_token(db, token)


@router.post("/auth/reset-password", response_model=ResetPasswordResponse)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid token."""
    return await service.reset_password(db, data.token, data.new_password, data.confirm_password)


# ═══════════════════════════════════════════════════════════
# ENDPOINTS PROTEGIDOS
# ═══════════════════════════════════════════════════════════

@router.get("/auth/me", response_model=UserOut)
async def get_me(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current authenticated user info."""
    return await service.get_me(db, current_user)


@router.post("/auth/logout", response_model=LogoutResponse)
async def logout(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout and invalidate session token."""
    return await service.logout(db, current_user, "")


# ═══════════════════════════════════════════════════════════
# GESTIÓN DE USUARIOS (Solo Admin)
# ═══════════════════════════════════════════════════════════

@router.get("/usuarios", response_model=PaginatedUsersResponse)
async def list_usuarios(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with pagination and optional search."""
    return await service.list_usuarios(db, search, page, page_size)


@router.get("/usuarios/{user_id}", response_model=UserOut)
async def get_usuario(
    user_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user by ID."""
    return await service.get_usuario(db, user_id)


@router.post("/usuarios", response_model=UserOut, status_code=201)
async def create_usuario(
    data: UserCreateRequest,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user."""
    return await service.create_usuario(db, data)


@router.put("/usuarios/{user_id}", response_model=UserOut)
async def update_usuario(
    user_id: int,
    data: UserUpdateRequest,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing user."""
    return await service.update_usuario(db, user_id, data)


@router.patch("/usuarios/{user_id}/deactivate", response_model=UserActionResponse)
async def deactivate_usuario(
    user_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a user."""
    return await service.deactivate_usuario(db, user_id, current_user)


@router.patch("/usuarios/{user_id}/reactivate", response_model=UserActionResponse)
async def reactivate_usuario(
    user_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reactivate a deactivated user."""
    return await service.reactivate_usuario(db, user_id)


# ═══════════════════════════════════════════════════════════
# PERFIL Y PREFERENCIAS
# ═══════════════════════════════════════════════════════════

@router.get("/perfil", response_model=PerfilResponse)
async def get_perfil(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user profile with preferences."""
    return await service.get_perfil(db, current_user)


@router.put("/perfil", response_model=UserOut)
async def update_perfil(
    data: UserUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile (name and email only)."""
    return await service.update_perfil(db, current_user, data.nombre_completo, data.email)


@router.put("/perfil/cambiar-password", response_model=ChangePasswordResponse)
async def change_password(
    data: ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change current user's password."""
    return await service.change_password(
        db, current_user,
        data.current_password, data.new_password, data.confirm_password,
    )


@router.get("/perfil/preferencias", response_model=PreferenciasOut)
async def get_preferencias(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's preferences."""
    return await service.get_preferencias(db, current_user)


@router.put("/perfil/preferencias", response_model=PreferenciasOut)
async def update_preferencias(
    data: PreferenciasUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's preferences."""
    return await service.update_preferencias(
        db, current_user,
        data.idioma, data.tema_visual, data.configuracion_regional,
    )
