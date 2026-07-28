from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from .dependencies import get_current_user, require_admin
from .models import Usuario
from .service import invalidate_user_sessions
from .schemas import (
    SetupRequest,
    SetupResponse,
    SetupStatusResponse,
    LoginRequest,
    LoginResponse,
    UserOut,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    VerifyTokenResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    PaginatedUsersResponse,
    UserCreateRequest,
    UserUpdateRequest,
    UserActionResponse,
    PerfilResponse,
    PreferenciasOut,
    PreferenciasUpdateRequest,
    LogoutResponse,
)
from .service import (
    check_setup,
    run_setup,
    authenticate_user,
    create_session,
    invalidate_session,
    create_reset_token,
    verify_reset_token,
    reset_password,
    list_usuarios,
    get_usuario,
    create_usuario,
    update_usuario,
    deactivate_usuario,
    reactivate_usuario,
    get_perfil,
    update_perfil,
    change_password,
    get_preferencias,
    update_preferencias,
)

router = APIRouter()


# ─── Setup Wizard ───────────────────────────────────────────────────────
@router.get("/auth/check-setup", response_model=SetupStatusResponse)
async def check_setup_endpoint(db: AsyncSession = Depends(get_db)):
    """Check if setup is completed and if an admin exists."""
    config_done, admin_exists = await check_setup(db)
    return SetupStatusResponse(setup_completed=config_done, admin_exists=admin_exists)


@router.post("/auth/setup", response_model=SetupResponse, status_code=status.HTTP_201_CREATED)
async def setup_endpoint(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Run the initial setup wizard (creates admin account + business config)."""
    try:
        user_out = await run_setup(db, data)
        return SetupResponse(mensaje="Configuración inicial completada exitosamente", usuario=user_out)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "SETUP_ALREADY_COMPLETED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="La configuración inicial ya fue completada",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ─── Authentication ─────────────────────────────────────────────────────
@router.post("/auth/login", response_model=LoginResponse)
async def login_endpoint(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return session token."""
    user = await authenticate_user(db, data.email, data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    token, expiry = await create_session(db, user, remember=data.remember)

    # Get user data
    rol_name = user.rol.nombre if hasattr(user.rol, "nombre") else str(user.rol)
    user_out = UserOut(
        id=user.id,
        nombre_completo=user.nombre_completo,
        email=user.email,
        rol=rol_name,
        activo=user.activo,
        fecha_registro=user.fecha_creacion,
        ultimo_acceso=user.ultimo_acceso,
    )

    expires_in = int((expiry - datetime.now(timezone.utc)).total_seconds())

    return LoginResponse(
        token=token,
        token_type="bearer",
        expires_in=expires_in,
        usuario=user_out,
    )


@router.post("/auth/logout", response_model=LogoutResponse)
async def logout_endpoint(
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout and invalidate current session."""
    await invalidate_user_sessions(db, user.id)
    return LogoutResponse(mensaje="Sesión cerrada exitosamente")


# ─── Password Recovery ─────────────────────────────────────────────────
@router.post("/auth/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password_endpoint(
    data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
):
    """Request a password reset email."""
    token = await create_reset_token(db, data.email)
    # Always return success to avoid revealing email existence
    if token:
        # In a real app, send email here with the reset link
        # For MVP, we just log/return success
        pass
    return ForgotPasswordResponse(
        mensaje="Si el correo está registrado, recibirás un enlace de recuperación"
    )


@router.get("/auth/verify-reset-token/{token}", response_model=VerifyTokenResponse)
async def verify_reset_token_endpoint(
    token: str, db: AsyncSession = Depends(get_db)
):
    """Verify if a reset token is valid."""
    email = await verify_reset_token(db, token)
    if email is None:
        # Check if expired
        from .utils import compute_token_hash
        from .models import TokenRestablecimiento
        from sqlalchemy import select

        token_hash = compute_token_hash(token)
        result = await db.execute(
            select(TokenRestablecimiento).where(
                TokenRestablecimiento.token_hash == token_hash
            )
        )
        existing = result.scalar_one_or_none()
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token no encontrado",
            )
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="El token ha expirado o ya fue utilizado",
        )

    return VerifyTokenResponse(valido=True, email=email)


@router.post("/auth/reset-password", response_model=ResetPasswordResponse)
async def reset_password_endpoint(
    data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
):
    """Reset password using a valid token."""
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden",
        )

    success = await reset_password(db, data.token, data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="El token es inválido o ha expirado",
        )

    return ResetPasswordResponse(mensaje="Contraseña restablecida exitosamente")


# ─── Current User / Me ──────────────────────────────────────────────────
@router.get("/auth/me", response_model=UserOut)
async def get_me_endpoint(
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current authenticated user info."""
    rol_name = user.rol.nombre if hasattr(user.rol, "nombre") else str(user.rol)
    return UserOut(
        id=user.id,
        nombre_completo=user.nombre_completo,
        email=user.email,
        rol=rol_name,
        activo=user.activo,
        fecha_registro=user.fecha_creacion,
        ultimo_acceso=user.ultimo_acceso,
    )


# ─── User Management (Admin only) ───────────────────────────────────────
@router.get("/usuarios", response_model=PaginatedUsersResponse)
async def list_usuarios_endpoint(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with pagination and optional search."""
    items, total = await list_usuarios(db, search, page, page_size)
    total_pages = max(1, (total + page_size - 1) // page_size)
    return PaginatedUsersResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/usuarios/{user_id}", response_model=UserOut)
async def get_usuario_endpoint(
    user_id: int,
    user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user by ID."""
    from .service import _user_to_out

    usuario = await get_usuario(db, user_id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    return await _user_to_out(db, usuario)


@router.post(
    "/usuarios",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_usuario_endpoint(
    data: UserCreateRequest,
    user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user."""
    try:
        return await create_usuario(db, data)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "EMAIL_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/usuarios/{user_id}", response_model=UserOut)
async def update_usuario_endpoint(
    user_id: int,
    data: UserUpdateRequest,
    user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing user."""
    try:
        result = await update_usuario(db, user_id, data)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        return result
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "EMAIL_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.patch("/usuarios/{user_id}/deactivate", response_model=UserActionResponse)
async def deactivate_usuario_endpoint(
    user_id: int,
    user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a user."""
    try:
        result = await deactivate_usuario(db, user_id, user.id)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        return UserActionResponse(
            mensaje="Usuario desactivado exitosamente",
            usuario=result,
        )
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "CANNOT_DEACTIVATE_SELF":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No puedes desactivar tu propia cuenta",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.patch("/usuarios/{user_id}/reactivate", response_model=UserActionResponse)
async def reactivate_usuario_endpoint(
    user_id: int,
    user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reactivate a user."""
    result = await reactivate_usuario(db, user_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    return UserActionResponse(
        mensaje="Usuario reactivado exitosamente",
        usuario=result,
    )


# ─── Profile ────────────────────────────────────────────────────────────
@router.get("/perfil", response_model=PerfilResponse)
async def get_perfil_endpoint(
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user profile with preferences."""
    user_out, preferencias = await get_perfil(db, user.id)
    if user_out is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil no encontrado",
        )
    return PerfilResponse(usuario=user_out, preferencias=preferencias)


@router.put("/perfil", response_model=UserOut)
async def update_perfil_endpoint(
    data: UserUpdateRequest,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile (name and email)."""
    try:
        result = await update_perfil(db, user.id, data.nombre_completo, data.email)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Perfil no encontrado",
            )
        return result
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "EMAIL_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/perfil/cambiar-password", response_model=ChangePasswordResponse)
async def change_password_endpoint(
    data: ChangePasswordRequest,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change current user's password."""
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden",
        )

    success = await change_password(db, user.id, data.current_password, data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta",
        )

    return ChangePasswordResponse(mensaje="Contraseña cambiada exitosamente")


@router.get("/perfil/preferencias", response_model=PreferenciasOut)
async def get_preferencias_endpoint(
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's preferences."""
    preferencias = await get_preferencias(db, user.id)
    return preferencias


@router.put("/perfil/preferencias", response_model=PreferenciasOut)
async def update_preferencias_endpoint(
    data: PreferenciasUpdateRequest,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's preferences."""
    result = await update_preferencias(db, user.id, data)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudieron actualizar las preferencias",
        )
    return result
