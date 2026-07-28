from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from .schemas import (
    SetupStatusResponse,
    SetupRequest,
    SetupResponse,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    VerifyTokenResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    UserOut,
    UserCreateRequest,
    UserUpdateRequest,
    UserActionResponse,
    PaginatedUsersResponse,
    PerfilResponse,
    PreferenciasOut,
    PreferenciasUpdateRequest,
)
from .service import (
    check_setup_status,
    run_setup,
    login_user,
    logout_user,
    forgot_password,
    verify_reset_token,
    reset_password,
    list_usuarios,
    get_usuario_by_id,
    create_usuario,
    update_usuario,
    deactivate_usuario,
    reactivate_usuario,
    update_perfil,
    change_password as change_password_service,
    get_preferencias,
    update_preferencias,
    _get_user_out,
)
from .utils import hash_token
from .dependencies import get_current_user, require_role
from .models import Usuario, TokenRestablecimiento
from sqlalchemy import select

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS PÚBLICOS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/auth/check-setup", response_model=SetupStatusResponse)
async def op_check_setup(db: AsyncSession = Depends(get_db)):
    """Check if the system setup has been completed."""
    setup_completed, admin_exists = await check_setup_status(db)
    return SetupStatusResponse(setup_completed=setup_completed, admin_exists=admin_exists)


@router.post("/auth/setup", response_model=SetupResponse, status_code=status.HTTP_201_CREATED)
async def op_run_setup(body: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Run the initial setup wizard."""
    try:
        user = await run_setup(
            db,
            nombre_completo=body.nombre_completo,
            email=body.email,
            password=body.password,
            negocio_nombre=body.negocio_nombre,
            negocio_direccion=body.negocio_direccion,
            negocio_rfc=body.negocio_rfc,
            negocio_telefono=body.negocio_telefono,
        )
        user_out = await _get_user_out(user)
        return SetupResponse(mensaje="Configuración inicial completada exitosamente", usuario=user_out)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "SETUP_ALREADY_COMPLETED":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SETUP_ALREADY_COMPLETED")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_DATA")


@router.post("/auth/login", response_model=LoginResponse)
async def op_login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return a JWT token."""
    try:
        token, expires_in, user = await login_user(db, body.email, body.password, body.remember)
        user_out = await _get_user_out(user)
        return LoginResponse(token=token, token_type="bearer", expires_in=expires_in, usuario=user_out)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="INVALID_CREDENTIALS")


@router.post("/auth/forgot-password", response_model=ForgotPasswordResponse)
async def op_forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset token."""
    raw_token = await forgot_password(db, body.email)
    # Always return success to avoid revealing account existence
    return ForgotPasswordResponse(
        mensaje="Si el correo está registrado, recibirás un enlace de recuperación"
    )


@router.get("/auth/verify-reset-token/{token}", response_model=VerifyTokenResponse)
async def op_verify_reset_token(token: str, db: AsyncSession = Depends(get_db)):
    """Verify if a reset token is valid."""
    email = await verify_reset_token(db, token)
    if email:
        return VerifyTokenResponse(valido=True, email=email)
    # Check if token exists but is expired
    token_hashed = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento).where(TokenRestablecimiento.token_hash == token_hashed)
    )
    existing = result.scalar_one_or_none()
    if existing and existing.fecha_expiracion < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="TOKEN_EXPIRED")
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TOKEN_NOT_FOUND")


@router.post("/auth/reset-password", response_model=ResetPasswordResponse)
async def op_reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid token."""
    if body.new_password != body.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PASSWORDS_DONT_MATCH")

    success = await reset_password(db, body.token, body.new_password)
    if not success:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="TOKEN_INVALID_OR_EXPIRED")

    return ResetPasswordResponse(mensaje="Contraseña restablecida exitosamente")


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS PROTEGIDOS — Auth
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/auth/me", response_model=UserOut)
async def op_me(current_user: Usuario = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return await _get_user_out(current_user)


@router.post("/auth/logout", response_model=LogoutResponse)
async def op_logout(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    authorization: str = Header(""),
):
    """Logout and invalidate current session."""
    token = authorization.replace("Bearer ", "") if authorization else ""
    if token:
        await logout_user(db, token)
    return LogoutResponse(mensaje="Sesión cerrada exitosamente")


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS PROTEGIDOS — Usuarios (Admin)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/usuarios", response_model=PaginatedUsersResponse)
async def op_list_usuarios(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: Usuario = Depends(require_role(["administrador"])),
    db: AsyncSession = Depends(get_db),
):
    """List all users with pagination and optional search."""
    users, total, total_pages = await list_usuarios(db, search=search, page=page, page_size=page_size)
    items = [await _get_user_out(u) for u in users]
    return PaginatedUsersResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/usuarios/{usuario_id}", response_model=UserOut)
async def op_get_usuario(
    usuario_id: int,
    current_user: Usuario = Depends(require_role(["administrador"])),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user by ID."""
    user = await get_usuario_by_id(db, usuario_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")
    return await _get_user_out(user)


@router.post("/usuarios", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def op_create_usuario(
    body: UserCreateRequest,
    current_user: Usuario = Depends(require_role(["administrador"])),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user."""
    try:
        user = await create_usuario(db, body.nombre_completo, body.email, body.password, body.rol)
        return await _get_user_out(user)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "EMAIL_EXISTS":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_EXISTS")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_DATA")


@router.put("/usuarios/{usuario_id}", response_model=UserOut)
async def op_update_usuario(
    usuario_id: int,
    body: UserUpdateRequest,
    current_user: Usuario = Depends(require_role(["administrador"])),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's details."""
    try:
        user = await update_usuario(db, usuario_id, body.nombre_completo, body.email, body.rol)
        return await _get_user_out(user)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "NOT_FOUND":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")
        if error_msg == "EMAIL_EXISTS":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_EXISTS")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_DATA")


@router.patch("/usuarios/{usuario_id}/deactivate", response_model=UserActionResponse)
async def op_deactivate_usuario(
    usuario_id: int,
    current_user: Usuario = Depends(require_role(["administrador"])),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a user account."""
    try:
        user = await deactivate_usuario(db, usuario_id, current_user.id)
        user_out = await _get_user_out(user)
        return UserActionResponse(mensaje="Usuario desactivado exitosamente", usuario=user_out)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "NOT_FOUND":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")
        if error_msg == "CANNOT_DEACTIVATE_SELF":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CANNOT_DEACTIVATE_SELF")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="FORBIDDEN")


@router.patch("/usuarios/{usuario_id}/reactivate", response_model=UserActionResponse)
async def op_reactivate_usuario(
    usuario_id: int,
    current_user: Usuario = Depends(require_role(["administrador"])),
    db: AsyncSession = Depends(get_db),
):
    """Reactivate a deactivated user account."""
    try:
        user = await reactivate_usuario(db, usuario_id)
        user_out = await _get_user_out(user)
        return UserActionResponse(mensaje="Usuario reactivado exitosamente", usuario=user_out)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "NOT_FOUND":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="FORBIDDEN")


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS PROTEGIDOS — Perfil
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/perfil", response_model=PerfilResponse)
async def op_get_perfil(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's profile and preferences."""
    user_out = await _get_user_out(current_user)
    prefs = await get_preferencias(db, current_user.id)
    preferencias_out = PreferenciasOut(
        idioma=prefs.idioma,
        tema_visual=prefs.tema_visual,
        zona_horaria=prefs.configuracion_regional,
    )
    return PerfilResponse(usuario=user_out, preferencias=preferencias_out)


@router.put("/perfil", response_model=UserOut)
async def op_update_perfil(
    body: UserUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile (name, email)."""
    try:
        user = await update_perfil(db, current_user.id, body.nombre_completo, body.email)
        return await _get_user_out(user)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "EMAIL_EXISTS":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_EXISTS")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_DATA")


@router.put("/perfil/cambiar-password", response_model=ChangePasswordResponse)
async def op_change_password(
    body: ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change current user's password."""
    if body.new_password != body.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PASSWORDS_DONT_MATCH")

    try:
        await change_password_service(db, current_user.id, body.current_password, body.new_password)
        return ChangePasswordResponse(mensaje="Contraseña cambiada exitosamente")
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "INVALID_CURRENT_PASSWORD":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_CURRENT_PASSWORD")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_DATA")


@router.get("/perfil/preferencias", response_model=PreferenciasOut)
async def op_get_preferencias_endpoint(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's preferences."""
    prefs = await get_preferencias(db, current_user.id)
    return PreferenciasOut(
        idioma=prefs.idioma,
        tema_visual=prefs.tema_visual,
        zona_horaria=prefs.configuracion_regional,
    )


@router.put("/perfil/preferencias", response_model=PreferenciasOut)
async def op_update_preferencias_endpoint(
    body: PreferenciasUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's preferences."""
    prefs = await update_preferencias(
        db,
        current_user.id,
        idioma=body.idioma,
        tema_visual=body.tema_visual,
        zona_horaria=body.zona_horaria,
    )
    return PreferenciasOut(
        idioma=prefs.idioma,
        tema_visual=prefs.tema_visual,
        zona_horaria=prefs.configuracion_regional,
    )
