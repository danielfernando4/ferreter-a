from typing import Optional

from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

from .dependencies import get_admin_user, get_current_user
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
    authenticate_user,
    change_password_service,
    check_setup_status,
    create_usuario,
    deactivate_usuario,
    forgot_password,
    get_current_user_profile,
    get_preferencias,
    get_usuario,
    list_usuarios,
    logout_user,
    reactivate_usuario,
    reset_password,
    run_setup,
    update_preferencias,
    update_profile,
    update_usuario,
    verify_reset_token,
)

router = APIRouter(tags=["Autenticación y Usuarios"])


# ─── Endpoints Públicos ────────────────────────────────────────────────


@router.get("/auth/check-setup", response_model=SetupStatusResponse)
async def check_setup(db: AsyncSession = Depends(get_db)):
    """Check if the initial setup has been completed."""
    return await check_setup_status(db)


@router.post("/auth/setup", response_model=SetupResponse)
async def setup(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Run the initial setup wizard to create admin and business config."""
    return await run_setup(db, data.model_dump())


@router.post("/auth/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password."""
    return await authenticate_user(db, data.email, data.password, data.remember)


@router.post("/auth/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password_endpoint(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset token."""
    return await forgot_password(db, data.email)


@router.get("/auth/verify-reset-token/{token}", response_model=VerifyTokenResponse)
async def verify_reset_token_endpoint(token: str, db: AsyncSession = Depends(get_db)):
    """Verify a password reset token is valid."""
    return await verify_reset_token(db, token)


@router.post("/auth/reset-password", response_model=ResetPasswordResponse)
async def reset_password_endpoint(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid token."""
    return await reset_password(db, data.token, data.new_password, data.confirm_password)


# ─── Endpoints Protegidos ──────────────────────────────────────────────


@router.get("/auth/me", response_model=UserOut)
async def get_me(current_user: Usuario = Depends(get_current_user)):
    """Get current authenticated user info."""
    return UserOut(
        id=current_user.id,
        nombre_completo=current_user.nombre_completo,
        email=current_user.email,
        rol=current_user.rol.nombre,
        activo=current_user.activo,
        fecha_registro=current_user.fecha_creacion,
        ultimo_acceso=current_user.fecha_creacion,
    )


@router.post("/auth/logout", response_model=LogoutResponse)
async def logout(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Logout and invalidate current session token."""
    token_raw = ""
    if authorization and authorization.startswith("Bearer "):
        token_raw = authorization[7:]
    return await logout_user(db, token_raw)


# ─── Endpoints de Usuarios (Admin) ──────────────────────────────────────


@router.get("/usuarios", response_model=PaginatedUsersResponse)
async def list_usuarios_endpoint(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user),
):
    """List all users with pagination and optional search."""
    return await list_usuarios(db, search, page, page_size)


@router.get("/usuarios/{user_id}", response_model=UserOut)
async def get_usuario_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user),
):
    """Get a specific user by ID."""
    return await get_usuario(db, user_id)


@router.post("/usuarios", response_model=UserOut)
async def create_usuario_endpoint(
    data: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user),
):
    """Create a new user."""
    return await create_usuario(db, data.model_dump())


@router.put("/usuarios/{user_id}", response_model=UserOut)
async def update_usuario_endpoint(
    user_id: int,
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user),
):
    """Update an existing user (cannot change password)."""
    return await update_usuario(db, user_id, data.model_dump(exclude_unset=True))


@router.patch("/usuarios/{user_id}/deactivate", response_model=UserActionResponse)
async def deactivate_usuario_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user),
):
    """Deactivate a user."""
    return await deactivate_usuario(db, user_id, current_user)


@router.patch("/usuarios/{user_id}/reactivate", response_model=UserActionResponse)
async def reactivate_usuario_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user),
):
    """Reactivate a deactivated user."""
    return await reactivate_usuario(db, user_id)


# ─── Endpoints de Perfil ────────────────────────────────────────────────


@router.get("/perfil", response_model=PerfilResponse)
async def get_perfil(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Get current user profile with preferences."""
    return await get_current_user_profile(db, current_user)


@router.put("/perfil", response_model=UserOut)
async def update_perfil(
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Update current user's profile (name, email)."""
    return await update_profile(db, current_user, data.model_dump(exclude_unset=True))


@router.put("/perfil/cambiar-password", response_model=ChangePasswordResponse)
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Change current user's password."""
    return await change_password_service(
        db, current_user, data.current_password, data.new_password, data.confirm_password
    )


@router.get("/perfil/preferencias", response_model=PreferenciasOut)
async def get_preferencias_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Get current user's preferences."""
    return await get_preferencias(db, current_user)


@router.put("/perfil/preferencias", response_model=PreferenciasOut)
async def update_preferencias_endpoint(
    data: PreferenciasUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Update current user's preferences."""
    return await update_preferencias(db, current_user, data.model_dump(exclude_unset=True))
