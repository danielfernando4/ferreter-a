from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

from .dependencies import get_current_user, require_admin
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


# ═══════════════════════════════════════════════════════════════════════════
# PÚBLICOS - Sin autenticación
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/auth/check-setup", response_model=SetupStatusResponse)
async def check_setup(db: AsyncSession = Depends(get_db)):
    """Check if the setup wizard has been completed."""
    return await check_setup_status(db)


@router.post("/auth/setup", response_model=SetupResponse, status_code=201)
async def setup(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Execute the initial setup wizard."""
    return await run_setup(db, data)


@router.post("/auth/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return a JWT token."""
    return await login_user(db, data.email, data.password, data.remember)


@router.post("/auth/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password_endpoint(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset token."""
    return await forgot_password(db, data.email)


@router.get("/auth/verify-reset-token/{token}", response_model=VerifyTokenResponse)
async def verify_reset_token_endpoint(token: str, db: AsyncSession = Depends(get_db)):
    """Verify if a reset token is valid."""
    return await verify_reset_token(db, token)


@router.post("/auth/reset-password", response_model=ResetPasswordResponse)
async def reset_password_endpoint(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid token."""
    return await reset_password(db, data.token, data.new_password, data.confirm_password)


# ═══════════════════════════════════════════════════════════════════════════
# PROTEGIDOS - Requieren token Bearer
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/auth/me", response_model=UserOut)
async def me(current_user: Usuario = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return UserOut(
        id=current_user.id,
        nombre_completo=current_user.nombre_completo,
        email=current_user.email,
        rol=current_user.rol.nombre if hasattr(current_user.rol, "nombre") else str(current_user.rol),
        activo=current_user.activo,
        fecha_creacion=current_user.fecha_creacion,
        ultimo_acceso=None,
    )


@router.post("/auth/logout", response_model=LogoutResponse)
async def logout(
    request: Request,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout and invalidate the current session token."""
    auth_header = request.headers.get("authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else ""
    return await logout_user(db, token)


# ═══════════════════════════════════════════════════════════════════════════
# GESTIÓN DE USUARIOS - Solo administradores
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/usuarios", response_model=PaginatedUsersResponse)
async def list_usuarios_endpoint(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """List all users with pagination and optional search."""
    return await list_usuarios(db, search=search, page=page, page_size=page_size)


@router.get("/usuarios/{user_id}", response_model=UserOut)
async def get_usuario_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Get a single user by ID."""
    user = await get_usuario(db, user_id)
    return UserOut(
        id=user.id,
        nombre_completo=user.nombre_completo,
        email=user.email,
        rol=user.rol.nombre if hasattr(user.rol, "nombre") else str(user.rol),
        activo=user.activo,
        fecha_creacion=user.fecha_creacion,
        ultimo_acceso=None,
    )


@router.post("/usuarios", response_model=UserOut, status_code=201)
async def create_usuario_endpoint(
    data: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Create a new user."""
    user = await create_usuario(db, data)
    return UserOut(
        id=user.id,
        nombre_completo=user.nombre_completo,
        email=user.email,
        rol=user.rol.nombre if hasattr(user.rol, "nombre") else str(user.rol),
        activo=user.activo,
        fecha_creacion=user.fecha_creacion,
        ultimo_acceso=None,
    )


@router.put("/usuarios/{user_id}", response_model=UserOut)
async def update_usuario_endpoint(
    user_id: int,
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Update an existing user."""
    user = await update_usuario(db, user_id, data)
    return UserOut(
        id=user.id,
        nombre_completo=user.nombre_completo,
        email=user.email,
        rol=user.rol.nombre if hasattr(user.rol, "nombre") else str(user.rol),
        activo=user.activo,
        fecha_creacion=user.fecha_creacion,
        ultimo_acceso=None,
    )


@router.patch("/usuarios/{user_id}/deactivate", response_model=UserActionResponse)
async def deactivate_usuario_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Deactivate a user."""
    user = await deactivate_usuario(db, user_id, current_user.id)
    return {
        "mensaje": "Usuario desactivado exitosamente",
        "usuario": UserOut(
            id=user.id,
            nombre_completo=user.nombre_completo,
            email=user.email,
            rol=user.rol.nombre if hasattr(user.rol, "nombre") else str(user.rol),
            activo=user.activo,
            fecha_creacion=user.fecha_creacion,
            ultimo_acceso=None,
        ),
    }


@router.patch("/usuarios/{user_id}/reactivate", response_model=UserActionResponse)
async def reactivate_usuario_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Reactivate a user."""
    user = await reactivate_usuario(db, user_id)
    return {
        "mensaje": "Usuario reactivado exitosamente",
        "usuario": UserOut(
            id=user.id,
            nombre_completo=user.nombre_completo,
            email=user.email,
            rol=user.rol.nombre if hasattr(user.rol, "nombre") else str(user.rol),
            activo=user.activo,
            fecha_creacion=user.fecha_creacion,
            ultimo_acceso=None,
        ),
    }


# ═══════════════════════════════════════════════════════════════════════════
# PERFIL - Usuario autenticado
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/perfil", response_model=PerfilResponse)
async def get_perfil_endpoint(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's profile and preferences."""
    return await get_perfil(db, current_user)


@router.put("/perfil", response_model=UserOut)
async def update_perfil_endpoint(
    data: UserUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile data."""
    user = await update_perfil(db, current_user, data.nombre_completo, data.email)
    return UserOut(
        id=user.id,
        nombre_completo=user.nombre_completo,
        email=user.email,
        rol=user.rol.nombre if hasattr(user.rol, "nombre") else str(user.rol),
        activo=user.activo,
        fecha_creacion=user.fecha_creacion,
        ultimo_acceso=None,
    )


@router.put("/perfil/cambiar-password", response_model=ChangePasswordResponse)
async def change_password_endpoint(
    data: ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change current user's password."""
    return await change_password(db, current_user, data.current_password, data.new_password, data.confirm_password)


@router.get("/perfil/preferencias", response_model=PreferenciasOut)
async def get_preferencias_endpoint(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's preferences."""
    return await get_preferencias(db, current_user)


@router.put("/perfil/preferencias", response_model=PreferenciasOut)
async def update_preferencias_endpoint(
    data: PreferenciasUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's preferences."""
    return await update_preferencias(db, current_user, data.idioma, data.tema_visual, data.zona_horaria)
