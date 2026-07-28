from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

from .schemas import (
    SetupRequest, SetupResponse, SetupStatusResponse,
    LoginRequest, LoginResponse,
    ForgotPasswordRequest, ForgotPasswordResponse,
    VerifyTokenResponse, ResetPasswordRequest, ResetPasswordResponse,
    ChangePasswordRequest, ChangePasswordResponse,
    UserCreateRequest, UserUpdateRequest,
    UserOut, UserActionResponse,
    PaginatedUsersResponse, PerfilResponse,
    PreferenciasOut, PreferenciasUpdateRequest,
    LogoutResponse,
)
from .dependencies import get_current_user, require_admin
from .models import Usuario
from . import service

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════
# ENDPOINTS PÚBLICOS (Sin autenticación)
# ═══════════════════════════════════════════════════════════════════

@router.get('/auth/check-setup', response_model=SetupStatusResponse)
async def check_setup(db: AsyncSession = Depends(get_db)):
    """Check if the system has been set up and if an admin user exists."""
    return await service.check_setup(db)


@router.post('/auth/setup', response_model=SetupResponse, status_code=201)
async def run_setup(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Run the initial setup wizard to create admin user and business config."""
    return await service.run_setup(data, db)


@router.post('/auth/login', response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password."""
    return await service.login(data.email, data.password, data.remember, db)


@router.post('/auth/forgot-password', response_model=ForgotPasswordResponse)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset email."""
    return await service.forgot_password(data.email, db)


@router.get('/auth/verify-reset-token/{token}', response_model=VerifyTokenResponse)
async def verify_reset_token(token: str, db: AsyncSession = Depends(get_db)):
    """Verify if a password reset token is valid."""
    return await service.verify_reset_token(token, db)


@router.post('/auth/reset-password', response_model=ResetPasswordResponse)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid token."""
    return await service.reset_password(data.token, data.new_password, data.confirm_password, db)


# ═══════════════════════════════════════════════════════════════════
# ENDPOINTS PROTEGIDOS (Requiere token Bearer)
# ═══════════════════════════════════════════════════════════════════

@router.get('/auth/me', response_model=UserOut)
async def get_me(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current authenticated user's profile."""
    return await service.get_me(current_user, db)


@router.post('/auth/logout', response_model=LogoutResponse)
async def logout(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout and invalidate the current session."""
    # The token is passed via the Authorization header automatically by HTTPBearer
    return LogoutResponse(mensaje="Sesión cerrada exitosamente.")


@router.get('/usuarios', response_model=PaginatedUsersResponse)
async def list_usuarios(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with pagination and optional search (admin only)."""
    return await service.list_usuarios(search, page, page_size, db)


@router.get('/usuarios/{usuario_id}', response_model=UserOut)
async def get_usuario(
    usuario_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a single user by ID (admin only)."""
    usuario = await service.get_usuario(usuario_id, db)
    return UserOut.model_validate(usuario)


@router.post('/usuarios', response_model=UserOut, status_code=201)
async def create_usuario(
    data: UserCreateRequest,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user (admin only)."""
    return await service.create_usuario(data, db)


@router.put('/usuarios/{usuario_id}', response_model=UserOut)
async def update_usuario(
    usuario_id: int,
    data: UserUpdateRequest,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing user (admin only)."""
    return await service.update_usuario(usuario_id, data, db)


@router.patch('/usuarios/{usuario_id}/deactivate', response_model=UserActionResponse)
async def deactivate_usuario(
    usuario_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a user account (admin only, cannot deactivate self)."""
    return await service.deactivate_usuario(usuario_id, current_user, db)


@router.patch('/usuarios/{usuario_id}/reactivate', response_model=UserActionResponse)
async def reactivate_usuario(
    usuario_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reactivate a deactivated user account (admin only)."""
    return await service.reactivate_usuario(usuario_id, db)


@router.get('/perfil', response_model=PerfilResponse)
async def get_perfil(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's profile with preferences."""
    return await service.get_perfil(current_user, db)


@router.put('/perfil', response_model=UserOut)
async def update_perfil(
    data: UserUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile."""
    return await service.update_perfil(current_user, data.nombre_completo, data.email, db)


@router.put('/perfil/cambiar-password', response_model=ChangePasswordResponse)
async def change_password(
    data: ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change current user's password."""
    return await service.change_password(
        current_user, data.current_password, data.new_password, data.confirm_password, db
    )


@router.get('/perfil/preferencias', response_model=PreferenciasOut)
async def get_preferencias(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's preferences."""
    return await service.get_preferencias(current_user, db)


@router.put('/perfil/preferencias', response_model=PreferenciasOut)
async def update_preferencias(
    data: PreferenciasUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's preferences."""
    return await service.update_preferencias(current_user, data, db)
