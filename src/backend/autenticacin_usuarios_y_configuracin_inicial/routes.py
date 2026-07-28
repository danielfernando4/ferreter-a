from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from autenticacin_usuarios_y_configuracin_inicial.schemas import (
    SetupStatusResponse, SetupRequest, SetupResponse,
    LoginRequest, LoginResponse, ForgotPasswordRequest,
    ForgotPasswordResponse, VerifyTokenResponse,
    ResetPasswordRequest, ResetPasswordResponse,
    UserOut, UserCreateRequest, UserUpdateRequest,
    PaginatedUsersResponse, UserActionResponse,
    PerfilResponse, PreferenciasOut, PreferenciasUpdateRequest,
    ChangePasswordRequest, ChangePasswordResponse, LogoutResponse,
)
from autenticacin_usuarios_y_configuracin_inicial.dependencies import (
    get_current_user, require_admin,
)
from autenticacin_usuarios_y_configuracin_inicial.models import Usuario
from autenticacin_usuarios_y_configuracin_inicial import service

router = APIRouter(tags=["auth"])


# ═══════════════════════════════════════════
# PUBLIC ENDPOINTS (no auth required)
# ═══════════════════════════════════════════

@router.get("/auth/check-setup", response_model=SetupStatusResponse)
async def check_setup(db: AsyncSession = Depends(get_db)):
    """Check if the system has been set up (setup wizard status)."""
    result = await service.check_setup_status(db)
    return SetupStatusResponse(**result)


@router.post("/auth/setup", response_model=SetupResponse)
async def run_setup(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Execute the initial setup wizard. Creates admin account and business config."""
    return await service.run_setup(db, data.model_dump())


@router.post("/auth/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return a session token."""
    return await service.login(db, data.email, data.password, data.remember)


@router.post("/auth/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset token (sent via email in production)."""
    return await service.forgot_password(db, data.email)


@router.get("/auth/verify-reset-token/{token}", response_model=VerifyTokenResponse)
async def verify_reset_token(token: str, db: AsyncSession = Depends(get_db)):
    """Verify a password reset token is valid and not expired."""
    return await service.verify_reset_token(db, token)


@router.post("/auth/reset-password", response_model=ResetPasswordResponse)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset a user's password using a valid reset token."""
    return await service.reset_password(db, data.token, data.new_password, data.confirm_password)


# ═══════════════════════════════════════════
# PROTECTED ENDPOINTS (auth required)
# ═══════════════════════════════════════════

@router.get("/auth/me", response_model=UserOut)
async def get_me(current_user: Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get the currently authenticated user's profile."""
    return await service.get_me(db, current_user)


@router.post("/auth/logout", response_model=LogoutResponse)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invalidate the current session token and log out."""
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="UNAUTHORIZED")
    return await service.logout(db, credentials.credentials)


# ═══════════════════════════════════════════
# ADMIN: USER MANAGEMENT (admin required)
# ═══════════════════════════════════════════

@router.get("/usuarios", response_model=PaginatedUsersResponse)
async def list_usuarios(
    search: Optional[str] = Query(None, description="Search by name or email"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """List all users with pagination and optional search (admin only)."""
    return await service.list_usuarios(db, search, page, page_size)


@router.get("/usuarios/{usuario_id}", response_model=UserOut)
async def get_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Get a single user by ID (admin only)."""
    user = await service.get_usuario(db, usuario_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")
    return UserOut.model_validate(user)


@router.post("/usuarios", response_model=UserOut, status_code=201)
async def create_usuario(
    data: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Create a new user (admin only)."""
    return await service.create_usuario(db, data.model_dump())


@router.put("/usuarios/{usuario_id}", response_model=UserOut)
async def update_usuario(
    usuario_id: int,
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Update a user's profile (name, email, role). Cannot change password (admin only)."""
    return await service.update_usuario(db, usuario_id, data.model_dump(exclude_none=True))


@router.patch("/usuarios/{usuario_id}/deactivate", response_model=UserActionResponse)
async def deactivate_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Deactivate a user. Cannot deactivate yourself (admin only)."""
    return await service.deactivate_usuario(db, usuario_id, current_user.id)


@router.patch("/usuarios/{usuario_id}/reactivate", response_model=UserActionResponse)
async def reactivate_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Reactivate a deactivated user (admin only)."""
    return await service.reactivate_usuario(db, usuario_id)


# ═══════════════════════════════════════════
# PROFILE ENDPOINTS (auth required)
# ═══════════════════════════════════════════

@router.get("/perfil", response_model=PerfilResponse)
async def get_perfil(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's profile and preferences."""
    return await service.get_perfil(db, current_user)


@router.put("/perfil", response_model=UserOut)
async def update_perfil(
    data: UserUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile (name, email)."""
    return await service.update_perfil(db, current_user, data.model_dump(exclude_none=True))


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
    return await service.update_preferencias(db, current_user, data.model_dump(exclude_none=True))
