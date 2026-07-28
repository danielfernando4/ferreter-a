from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
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
    _build_preferencias_out,
    _build_user_out,
    admin_exists,
    authenticate_user,
    change_password,
    check_setup_completed,
    create_reset_token,
    create_session_token,
    create_usuario,
    deactivate_usuario,
    get_preferencias,
    get_usuario_by_email,
    get_usuario_by_id,
    invalidate_session,
    list_usuarios,
    reactivate_usuario,
    run_setup,
    update_preferencias,
    update_usuario,
    use_reset_token,
    verify_reset_token,
)
from .utils import get_expires_in_seconds

router = APIRouter()
security = HTTPBearer(auto_error=False)


# ============================================================
# ENDPOINTS PÚBLICOS
# ============================================================


@router.get("/auth/check-setup", response_model=SetupStatusResponse)
async def op_check_setup(db: AsyncSession = Depends(get_db)):
    """Check if the system has been set up (setup wizard completed)."""
    setup_done = await check_setup_completed(db)
    admin = await admin_exists(db)
    return SetupStatusResponse(setup_completed=setup_done, admin_exists=admin)


@router.post("/auth/setup", response_model=SetupResponse, status_code=status.HTTP_201_CREATED)
async def op_run_setup(body: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Run the initial setup wizard. Creates admin user and business config."""
    setup_done = await check_setup_completed(db)
    if setup_done:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SETUP_ALREADY_COMPLETED: El sistema ya ha sido configurado",
        )

    existing = await get_usuario_by_email(db, body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_DATA: El correo electrónico ya está registrado",
        )

    try:
        user, _ = await run_setup(
            db=db,
            nombre_completo=body.nombre_completo,
            email=body.email,
            password=body.password,
            negocio_nombre=body.negocio_nombre,
            negocio_direccion=body.negocio_direccion,
            negocio_rfc=body.negocio_rfc,
            negocio_telefono=body.negocio_telefono,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"INVALID_DATA: {str(e)}",
        )

    user_out = await _build_user_out(user)
    return SetupResponse(mensaje="Configuración inicial completada exitosamente", usuario=user_out)


@router.post("/auth/login", response_model=LoginResponse)
async def op_login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return a session token."""
    user = await authenticate_user(db, email=body.email, password=body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="INVALID_CREDENTIALS: Credenciales inválidas",
        )

    token_raw, expiry = await create_session_token(db, user, remember=body.remember)
    await db.commit()

    user_out = await _build_user_out(user)
    return LoginResponse(
        token=token_raw,
        token_type="bearer",
        expires_in=get_expires_in_seconds(expiry),
        usuario=user_out,
    )


@router.post("/auth/forgot-password", response_model=ForgotPasswordResponse)
async def op_forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset token. Always returns success to avoid user enumeration."""
    await create_reset_token(db, email=body.email)
    await db.commit()
    return ForgotPasswordResponse(
        mensaje="Si el correo está registrado, recibirás un enlace para restablecer tu contraseña"
    )


@router.get("/auth/verify-reset-token/{token}", response_model=VerifyTokenResponse)
async def op_verify_reset_token(token: str, db: AsyncSession = Depends(get_db)):
    """Verify if a reset token is valid."""
    user = await verify_reset_token(db, token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TOKEN_NOT_FOUND: El token no es válido o ha expirado",
        )
    return VerifyTokenResponse(valido=True, email=user.email)


@router.post("/auth/reset-password", response_model=ResetPasswordResponse)
async def op_reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid token."""
    if body.new_password != body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PASSWORDS_DONT_MATCH: Las contraseñas no coinciden",
        )

    success = await use_reset_token(db, token_raw=body.token, new_password=body.new_password)
    await db.commit()
    if not success:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="TOKEN_INVALID_OR_EXPIRED: El token no es válido, ya fue utilizado o ha expirado",
        )

    return ResetPasswordResponse(mensaje="Contraseña restablecida exitosamente")


# ============================================================
# ENDPOINTS PROTEGIDOS (Autenticación requerida)
# ============================================================


@router.get("/auth/me", response_model=UserOut)
async def op_me(current_user: Usuario = Depends(get_current_user)):
    """Get the profile of the currently authenticated user."""
    return await _build_user_out(current_user)


@router.post("/auth/logout", response_model=LogoutResponse)
async def op_logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """Logout by invalidating the current session token."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="UNAUTHORIZED: Se requiere autenticación",
        )
    success = await invalidate_session(db, credentials.credentials)
    await db.commit()
    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="UNAUTHORIZED: Token inválido",
        )
    return LogoutResponse(mensaje="Sesión cerrada exitosamente")


# ============================================================
# ENDPOINTS PROTEGIDOS (Admin requerido) — Gestión de Usuarios
# ============================================================


@router.get("/usuarios", response_model=PaginatedUsersResponse)
async def op_list_usuarios(
    search: str | None = Query(None, description="Búsqueda por nombre"),
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=100, description="Elementos por página"),
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with pagination and optional search (admin only)."""
    users, total = await list_usuarios(db, search=search, page=page, page_size=page_size)
    items = [await _build_user_out(u) for u in users]
    total_pages = ceil(total / page_size) if total > 0 else 1
    return PaginatedUsersResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/usuarios/{user_id}", response_model=UserOut)
async def op_get_usuario(
    user_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user by ID (admin only)."""
    user = await get_usuario_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND: Usuario no encontrado",
        )
    return await _build_user_out(user)


@router.post("/usuarios", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def op_create_usuario(
    body: UserCreateRequest,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user (admin only)."""
    # Check if email already exists
    existing = await get_usuario_by_email(db, body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="EMAIL_EXISTS: El correo electrónico ya está registrado",
        )

    # Validate rol
    valid_roles = {"administrador", "vendedor", "almacen"}
    if body.rol not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"INVALID_DATA: Rol inválido. Debe ser uno de: {', '.join(valid_roles)}",
        )

    try:
        user = await create_usuario(
            db=db,
            nombre_completo=body.nombre_completo,
            email=body.email,
            password=body.password,
            rol_nombre=body.rol,
        )
        await db.commit()
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"INVALID_DATA: {str(e)}",
        )

    return await _build_user_out(user)


@router.put("/usuarios/{user_id}", response_model=UserOut)
async def op_update_usuario(
    user_id: int,
    body: UserUpdateRequest,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a user (admin only). Cannot change password."""
    user = await get_usuario_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND: Usuario no encontrado",
        )

    # Check email uniqueness if changing
    if body.email is not None and body.email != user.email:
        existing = await get_usuario_by_email(db, body.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="EMAIL_EXISTS: El correo electrónico ya está registrado",
            )

    # Validate rol if changing
    if body.rol is not None:
        valid_roles = {"administrador", "vendedor", "almacen"}
        if body.rol not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"INVALID_DATA: Rol inválido. Debe ser uno de: {', '.join(valid_roles)}",
            )

    try:
        user = await update_usuario(
            db=db,
            user=user,
            nombre_completo=body.nombre_completo,
            email=body.email,
            rol_nombre=body.rol,
        )
        await db.commit()
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"INVALID_DATA: {str(e)}",
        )

    return await _build_user_out(user)


@router.patch("/usuarios/{user_id}/deactivate", response_model=UserActionResponse)
async def op_deactivate_usuario(
    user_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a user (admin only). Cannot deactivate self."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="CANNOT_DEACTIVATE_SELF: No puedes desactivar tu propia cuenta",
        )

    user = await get_usuario_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND: Usuario no encontrado",
        )

    user = await deactivate_usuario(db, user)
    await db.commit()

    user_out = await _build_user_out(user)
    return UserActionResponse(mensaje="Usuario desactivado exitosamente", usuario=user_out)


@router.patch("/usuarios/{user_id}/reactivate", response_model=UserActionResponse)
async def op_reactivate_usuario(
    user_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reactivate a user (admin only)."""
    user = await get_usuario_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND: Usuario no encontrado",
        )

    user = await reactivate_usuario(db, user)
    await db.commit()

    user_out = await _build_user_out(user)
    return UserActionResponse(mensaje="Usuario reactivado exitosamente", usuario=user_out)


# ============================================================
# ENDPOINTS PROTEGIDOS — Perfil y Preferencias
# ============================================================


@router.get("/perfil", response_model=PerfilResponse)
async def op_get_perfil(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the profile and preferences of the current user."""
    user_out = await _build_user_out(current_user)
    prefs = await get_preferencias(db, current_user.id)
    if prefs is None:
        preferencias_out = PreferenciasOut()
    else:
        preferencias_out = await _build_preferencias_out(prefs)
    return PerfilResponse(usuario=user_out, preferencias=preferencias_out)


@router.put("/perfil", response_model=UserOut)
async def op_update_perfil(
    body: UserUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the profile (name, email) of the current user."""
    # Check email uniqueness if changing
    if body.email is not None and body.email != current_user.email:
        existing = await get_usuario_by_email(db, body.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="EMAIL_EXISTS: El correo electrónico ya está registrado",
            )

    try:
        user = await update_usuario(
            db=db,
            user=current_user,
            nombre_completo=body.nombre_completo,
            email=body.email,
            rol_nombre=None,  # Users cannot change their own role
        )
        await db.commit()
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"INVALID_DATA: {str(e)}",
        )

    return await _build_user_out(user)


@router.put("/perfil/cambiar-password", response_model=ChangePasswordResponse)
async def op_change_password(
    body: ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the password of the current user."""
    if body.new_password != body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PASSWORDS_DONT_MATCH: Las contraseñas no coinciden",
        )

    success = await change_password(
        db=db,
        user=current_user,
        current_password=body.current_password,
        new_password=body.new_password,
    )
    await db.commit()

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_CURRENT_PASSWORD: La contraseña actual es incorrecta",
        )

    return ChangePasswordResponse(
        mensaje="Contraseña cambiada exitosamente. Se han cerrado todas las sesiones activas."
    )


@router.get("/perfil/preferencias", response_model=PreferenciasOut)
async def op_get_preferencias(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the preferences of the current user."""
    prefs = await get_preferencias(db, current_user.id)
    if prefs is None:
        return PreferenciasOut()
    return await _build_preferencias_out(prefs)


@router.put("/perfil/preferencias", response_model=PreferenciasOut)
async def op_update_preferencias(
    body: PreferenciasUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the preferences of the current user."""
    # Map zona_horaria -> configuracion_regional for storage
    prefs = await update_preferencias(
        db=db,
        user_id=current_user.id,
        idioma=body.idioma,
        tema_visual=body.tema_visual,
        configuracion_regional=body.zona_horaria,
    )
    await db.commit()
    return await _build_preferencias_out(prefs)
