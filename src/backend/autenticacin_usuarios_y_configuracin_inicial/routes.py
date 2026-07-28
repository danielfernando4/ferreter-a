import math
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from autenticacin_usuarios_y_configuracin_inicial.dependencies import get_current_user, require_admin

security_scheme = HTTPBearer()
from autenticacin_usuarios_y_configuracin_inicial.models import Usuario
from autenticacin_usuarios_y_configuracin_inicial.schemas import (
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
from autenticacin_usuarios_y_configuracin_inicial.service import (
    authenticate_user,
    change_user_password,
    check_setup_status,
    create_reset_token,
    create_session_token,
    create_usuario,
    deactivate_usuario,
    get_preferencias,
    get_usuario_by_email,
    get_usuario_by_id,
    invalidate_all_user_tokens,
    invalidate_token,
    list_usuarios,
    reactivate_usuario,
    reset_password,
    run_setup,
    update_perfil,
    update_preferencias,
    update_usuario,
    verify_reset_token,
)

router = APIRouter()

# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS PÚBLICOS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get('/auth/check-setup', response_model=SetupStatusResponse, tags=['Setup'])
async def check_setup(db: AsyncSession = Depends(get_db)):
    """Check if the initial setup wizard has been completed."""
    setup_completed, admin_exists = await check_setup_status(db)
    return SetupStatusResponse(setup_completed=setup_completed, admin_exists=admin_exists)


@router.post('/auth/setup', response_model=SetupResponse, tags=['Setup'])
async def setup_wizard(req: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Run the initial setup wizard (first-time configuration)."""
    _, admin_exists = await check_setup_status(db)
    if admin_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El asistente de configuración ya fue completado.",
        )

    existing = await get_usuario_by_email(db, req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo electrónico ya está registrado.",
        )

    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres.",
        )

    try:
        user = await run_setup(
            db=db,
            nombre_completo=req.nombre_completo,
            email=req.email,
            password=req.password,
            negocio_nombre=req.negocio_nombre,
            negocio_direccion=req.negocio_direccion,
            negocio_rfc=req.negocio_rfc,
            negocio_telefono=req.negocio_telefono,
        )
        return SetupResponse(mensaje="Configuración inicial completada exitosamente.", usuario=user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al ejecutar la configuración inicial: {str(e)}",
        )


@router.post('/auth/login', response_model=LoginResponse, tags=['Auth'])
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password."""
    user = await authenticate_user(db, req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas. Verifique su correo y contraseña.",
        )

    token = await create_session_token(db, user, persistent=req.remember)
    expires_in = 28800 if not req.remember else 2592000  # 8h or 30d in seconds

    return LoginResponse(
        token=token,
        token_type="bearer",
        expires_in=expires_in,
        usuario=user,
    )


@router.post('/auth/forgot-password', response_model=ForgotPasswordResponse, tags=['Auth'])
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Send a password reset email (simulated)."""
    token = await create_reset_token(db, req.email)
    # In a real app, send email here. For MVP, we just return success.
    return ForgotPasswordResponse(
        mensaje="Si el correo está registrado, recibirá un enlace para restablecer su contraseña."
    )


@router.get('/auth/verify-reset-token/{token}', response_model=VerifyTokenResponse, tags=['Auth'])
async def verify_reset_token_endpoint(token: str, db: AsyncSession = Depends(get_db)):
    """Verify if a password reset token is valid."""
    email = await verify_reset_token(db, token)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El enlace de restablecimiento no es válido o ha expirado.",
        )
    return VerifyTokenResponse(valido=True, email=email)


@router.post('/auth/reset-password', response_model=ResetPasswordResponse, tags=['Auth'])
async def reset_password_endpoint(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid token."""
    if req.new_password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden.",
        )
    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres.",
        )

    success = await reset_password(db, req.token, req.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="El enlace de restablecimiento no es válido o ha expirado.",
        )
    return ResetPasswordResponse(mensaje="Contraseña restablecida exitosamente.")


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS PROTEGIDOS (Requiere token)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get('/auth/me', response_model=UserOut, tags=['Auth'])
async def get_me(user: Usuario = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return user


@router.post('/auth/logout', response_model=LogoutResponse, tags=['Auth'])
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Logout by invalidating the current session token."""
    await invalidate_token(db, credentials.credentials)
    return LogoutResponse(mensaje="Sesión cerrada exitosamente.")


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS DE ADMINISTRACIÓN DE USUARIOS (Requiere admin)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get('/usuarios', response_model=PaginatedUsersResponse, tags=['Admin'])
async def list_usuarios_endpoint(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    """List all users with pagination and optional search."""
    users, total = await list_usuarios(db, search=search, page=page, page_size=page_size)
    total_pages = max(1, math.ceil(total / page_size))
    return PaginatedUsersResponse(
        items=[UserOut.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get('/usuarios/{user_id}', response_model=UserOut, tags=['Admin'])
async def get_usuario_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    """Get a specific user by ID."""
    user = await get_usuario_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )
    return user


@router.post('/usuarios', response_model=UserOut, status_code=status.HTTP_201_CREATED, tags=['Admin'])
async def create_usuario_endpoint(
    req: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    """Create a new user."""
    if req.rol not in ("administrador", "vendedor", "almacen"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rol inválido. Los roles válidos son: administrador, vendedor, almacen.",
        )
    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres.",
        )

    existing = await get_usuario_by_email(db, req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo electrónico ya está registrado.",
        )

    try:
        user = await create_usuario(
            db=db,
            nombre_completo=req.nombre_completo,
            email=req.email,
            password=req.password,
            rol_nombre=req.rol,
        )
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear usuario: {str(e)}",
        )


@router.put('/usuarios/{user_id}', response_model=UserOut, tags=['Admin'])
async def update_usuario_endpoint(
    user_id: int,
    req: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    """Update a user's details."""
    if req.email is not None:
        existing = await get_usuario_by_email(db, req.email)
        if existing and existing.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado por otro usuario.",
            )

    user = await update_usuario(
        db=db,
        user_id=user_id,
        nombre_completo=req.nombre_completo,
        email=req.email,
        rol_nombre=req.rol,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )
    return user


@router.patch('/usuarios/{user_id}/deactivate', response_model=UserActionResponse, tags=['Admin'])
async def deactivate_usuario_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    """Deactivate a user."""
    if admin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No puede desactivar su propia cuenta.",
        )

    user = await deactivate_usuario(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )
    return UserActionResponse(mensaje="Usuario desactivado exitosamente.", usuario=user)


@router.patch('/usuarios/{user_id}/reactivate', response_model=UserActionResponse, tags=['Admin'])
async def reactivate_usuario_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    """Reactivate a user."""
    user = await reactivate_usuario(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )
    return UserActionResponse(mensaje="Usuario reactivado exitosamente.", usuario=user)


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS DE PERFIL Y PREFERENCIAS (Requiere autenticación)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get('/perfil', response_model=PerfilResponse, tags=['Perfil'])
async def get_perfil(
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's profile and preferences."""
    preferencias = await get_preferencias(db, user.id)
    pref_out = PreferenciasOut(
        idioma=preferencias.idioma if preferencias else "es",
        tema_visual=preferencias.tema_visual if preferencias else "light",
        zona_horaria=preferencias.configuracion_regional if preferencias else "America/Mexico_City",
    )
    return PerfilResponse(usuario=user, preferencias=pref_out)


@router.put('/perfil', response_model=UserOut, tags=['Perfil'])
async def update_perfil_endpoint(
    req: UserUpdateRequest,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile."""
    if req.email is not None:
        existing = await get_usuario_by_email(db, req.email)
        if existing and existing.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado por otro usuario.",
            )

    updated = await update_perfil(
        db=db,
        user_id=user.id,
        nombre_completo=req.nombre_completo,
        email=req.email,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al actualizar el perfil.",
        )
    return updated


@router.put('/perfil/cambiar-password', response_model=ChangePasswordResponse, tags=['Perfil'])
async def change_password_endpoint(
    req: ChangePasswordRequest,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the current user's password."""
    if req.new_password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas nuevas no coinciden.",
        )
    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 6 caracteres.",
        )

    success = await change_user_password(db, user, req.current_password, req.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta.",
        )
    return ChangePasswordResponse(mensaje="Contraseña cambiada exitosamente.")


@router.get('/perfil/preferencias', response_model=PreferenciasOut, tags=['Perfil'])
async def get_preferencias_endpoint(
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's preferences."""
    preferencias = await get_preferencias(db, user.id)
    if not preferencias:
        return PreferenciasOut()
    return PreferenciasOut(
        idioma=preferencias.idioma,
        tema_visual=preferencias.tema_visual,
        zona_horaria=preferencias.configuracion_regional,
    )


@router.put('/perfil/preferencias', response_model=PreferenciasOut, tags=['Perfil'])
async def update_preferencias_endpoint(
    req: PreferenciasUpdateRequest,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's preferences."""
    pref = await update_preferencias(
        db=db,
        user_id=user.id,
        idioma=req.idioma,
        tema_visual=req.tema_visual,
        zona_horaria=req.zona_horaria,
    )
    if not pref:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al actualizar las preferencias.",
        )
    return PreferenciasOut(
        idioma=pref.idioma,
        tema_visual=pref.tema_visual,
        zona_horaria=pref.configuracion_regional,
    )
