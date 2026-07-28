from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

from .dependencies import get_current_user, require_admin, security
from .models import Usuario
from .schemas import (
    ChangePasswordRequest,
    ChangePasswordResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    PaginatedUsersResponse,
    PerfilResponse,
    PreferenciasOut,
    PreferenciasUpdateRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    SetupRequest,
    SetupResponse,
    SetupStatusResponse,
    UserActionResponse,
    UserCreateRequest,
    UserOut,
    UserUpdateRequest,
    VerifyTokenResponse,
)
from .service import (
    change_password,
    check_setup_status,
    create_usuario,
    deactivate_usuario,
    forgot_password,
    get_perfil,
    get_preferencias,
    get_usuario,
    list_usuarios,
    login_user,
    logout_user,
    reactivate_usuario,
    reset_password,
    run_setup,
    update_perfil,
    update_preferencias,
    update_usuario,
    verify_reset_token,
)

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════
# ENDPOINTS PÚBLICOS (Sin autenticación)
# ═══════════════════════════════════════════════════════════════════════

@router.get('/auth/check-setup', response_model=SetupStatusResponse)
async def op_check_setup(db: AsyncSession = Depends(get_db)):
    """Check if setup has been completed and if any admin exists."""
    result = await check_setup_status(db)
    return SetupStatusResponse(**result)


@router.post('/auth/setup', response_model=SetupResponse, status_code=201)
async def op_run_setup(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Execute the initial setup wizard."""
    result = await run_setup(data, db)
    return SetupResponse(**result)


@router.post('/auth/login', response_model=LoginResponse)
async def op_login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password."""
    result = await login_user(data.email, data.password, data.remember, db)
    return LoginResponse(**result)


@router.post('/auth/forgot-password', response_model=ForgotPasswordResponse)
async def op_forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset token."""
    result = await forgot_password(data.email, db)
    return ForgotPasswordResponse(**result)


@router.get('/auth/verify-reset-token/{token}', response_model=VerifyTokenResponse)
async def op_verify_reset_token(token: str, db: AsyncSession = Depends(get_db)):
    """Verify if a reset token is still valid."""
    result = await verify_reset_token(token, db)
    return VerifyTokenResponse(**result)


@router.post('/auth/reset-password', response_model=ResetPasswordResponse)
async def op_reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid token."""
    result = await reset_password(data.token, data.new_password, data.confirm_password, db)
    return ResetPasswordResponse(**result)


# ═══════════════════════════════════════════════════════════════════════
# ENDPOINTS PROTEGIDOS — Auth / Perfil
# ═══════════════════════════════════════════════════════════════════════

@router.get('/auth/me', response_model=UserOut)
async def op_me(
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current authenticated user's profile."""
    from .service import _get_user_out
    return await _get_user_out(user, db)


@router.post('/auth/logout', response_model=LogoutResponse)
async def op_logout(
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Logout and invalidate the current session token."""
    token = credentials.credentials
    result = await logout_user(user, token, db)
    return LogoutResponse(**result)


# ═══════════════════════════════════════════════════════════════════════
# ENDPOINTS PROTEGIDOS — Gestión de Usuarios (Solo Admin)
# ═══════════════════════════════════════════════════════════════════════

@router.get('/usuarios', response_model=PaginatedUsersResponse)
async def op_list_usuarios(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with pagination and optional search."""
    result = await list_usuarios(db, search, page, page_size)
    return PaginatedUsersResponse(**result)


@router.get('/usuarios/{usuario_id}', response_model=UserOut)
async def op_get_usuario(
    usuario_id: int,
    user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a single user by ID."""
    found_user = await get_usuario(usuario_id, db)
    return UserOut.model_validate(found_user)


@router.post('/usuarios', response_model=UserOut, status_code=201)
async def op_create_usuario(
    data: UserCreateRequest,
    user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user."""
    return await create_usuario(data, db)


@router.put('/usuarios/{usuario_id}', response_model=UserOut)
async def op_update_usuario(
    usuario_id: int,
    data: UserUpdateRequest,
    user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing user."""
    return await update_usuario(usuario_id, data, db)


@router.patch('/usuarios/{usuario_id}/deactivate', response_model=UserActionResponse)
async def op_deactivate_usuario(
    usuario_id: int,
    user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a user account."""
    result = await deactivate_usuario(usuario_id, user.id, db)
    return UserActionResponse(**result)


@router.patch('/usuarios/{usuario_id}/reactivate', response_model=UserActionResponse)
async def op_reactivate_usuario(
    usuario_id: int,
    user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reactivate a deactivated user account."""
    result = await reactivate_usuario(usuario_id, db)
    return UserActionResponse(**result)


# ═══════════════════════════════════════════════════════════════════════
# ENDPOINTS PROTEGIDOS — Perfil y Preferencias
# ═══════════════════════════════════════════════════════════════════════

@router.get('/perfil', response_model=PerfilResponse)
async def op_get_perfil(
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's profile with preferences."""
    return await get_perfil(user, db)


@router.put('/perfil', response_model=UserOut)
async def op_update_perfil(
    data: UserUpdateRequest,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile."""
    return await update_perfil(user, data.nombre_completo, data.email, db)


@router.put('/perfil/cambiar-password', response_model=ChangePasswordResponse)
async def op_change_password(
    data: ChangePasswordRequest,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change current user's password."""
    result = await change_password(user, data.current_password, data.new_password, data.confirm_password, db)
    return ChangePasswordResponse(**result)


@router.get('/perfil/preferencias', response_model=PreferenciasOut)
async def op_get_preferencias(
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's preferences."""
    return await get_preferencias(user, db)


@router.put('/perfil/preferencias', response_model=PreferenciasOut)
async def op_update_preferencias(
    data: PreferenciasUpdateRequest,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's preferences."""
    return await update_preferencias(user, data, db)
