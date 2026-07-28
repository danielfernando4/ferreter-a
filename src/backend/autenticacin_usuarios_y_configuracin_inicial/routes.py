from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from autenticacin_usuarios_y_configuracin_inicial.dependencies import (
    get_current_user,
    require_admin,
)
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
    ensure_roles_exist,
    get_preferencias,
    get_usuario_by_email,
    get_usuario_by_id,
    invalidate_all_user_tokens,
    invalidate_token,
    list_usuarios,
    reactivate_usuario,
    reset_password,
    run_setup,
    update_preferencias,
    update_usuario,
    verify_reset_token,
)
from database import get_db

router = APIRouter()


# ───────────────────────────────────────────────────────
# Endpoints Públicos — Setup Wizard
# ───────────────────────────────────────────────────────

@router.get("/auth/check-setup", response_model=SetupStatusResponse, tags=["Setup"])
async def op_check_setup(db: AsyncSession = Depends(get_db)):
    """Verifica si el setup inicial ha sido completado."""
    try:
        setup_completed, admin_exists = await check_setup_status(db)
        return SetupStatusResponse(setup_completed=setup_completed, admin_exists=admin_exists)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/setup", response_model=SetupResponse, status_code=201, tags=["Setup"])
async def op_run_setup(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Ejecuta el asistente de configuración inicial (setup wizard)."""
    try:
        # Ensure roles exist
        await ensure_roles_exist(db)

        # Check if setup already completed
        setup_completed, admin_exists = await check_setup_status(db)
        if setup_completed or admin_exists:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="La configuración inicial ya ha sido completada",
            )

        # Check email uniqueness
        existing = await get_usuario_by_email(db, data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado",
            )

        usuario = await run_setup(db, data.model_dump())
        return SetupResponse(mensaje="Configuración inicial completada exitosamente", usuario=UserOut.model_validate(usuario))
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ───────────────────────────────────────────────────────
# Endpoints Públicos — Autenticación
# ───────────────────────────────────────────────────────

@router.post("/auth/login", response_model=LoginResponse, tags=["Auth"])
async def op_login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Inicia sesión con credenciales (email + password)."""
    try:
        usuario = await authenticate_user(db, data.email, data.password)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
            )

        token_str, expires_in = await create_session_token(db, usuario, remember=data.remember)

        return LoginResponse(
            token=token_str,
            token_type="bearer",
            expires_in=expires_in,
            usuario=UserOut.model_validate(usuario),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/forgot-password", response_model=ForgotPasswordResponse, tags=["Auth"])
async def op_forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Solicita un enlace de recuperación de contraseña."""
    try:
        token_str = await create_reset_token(db, data.email)
        # Always return success to not reveal whether email exists
        return ForgotPasswordResponse(
            mensaje="Si el correo está registrado, recibirás un enlace de recuperación"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/auth/verify-reset-token/{token}", response_model=VerifyTokenResponse, tags=["Auth"])
async def op_verify_reset_token(token: str, db: AsyncSession = Depends(get_db)):
    """Verifica si un token de restablecimiento es válido."""
    try:
        email = await verify_reset_token(db, token)
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token no encontrado o expirado",
            )
        return VerifyTokenResponse(valido=True, email=email)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/reset-password", response_model=ResetPasswordResponse, tags=["Auth"])
async def op_reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Restablece la contraseña usando un token válido."""
    try:
        if data.new_password != data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Las contraseñas no coinciden",
            )

        success = await reset_password(db, data.token, data.new_password)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Token inválido o expirado",
            )

        return ResetPasswordResponse(mensaje="Contraseña restablecida exitosamente")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ───────────────────────────────────────────────────────
# Endpoints Protegidos — Perfil y Sesión
# ───────────────────────────────────────────────────────

@router.get("/auth/me", response_model=UserOut, tags=["Auth"])
async def op_me(current_user: Usuario = Depends(get_current_user)):
    """Obtiene los datos del usuario autenticado."""
    try:
        return UserOut.model_validate(current_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/logout", response_model=LogoutResponse, tags=["Auth"])
async def op_logout(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cierra la sesión del usuario autenticado invalidando todos sus tokens."""
    try:
        await invalidate_all_user_tokens(db, current_user.id)
        return LogoutResponse(mensaje="Sesión cerrada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ───────────────────────────────────────────────────────
# Endpoints Protegidos — Gestión de Usuarios (Admin)
# ───────────────────────────────────────────────────────

@router.get("/usuarios", response_model=PaginatedUsersResponse, tags=["Admin"])
async def op_list_usuarios(
    search: str = Query(None, description="Búsqueda por nombre o email"),
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=100, description="Elementos por página"),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Lista todos los usuarios con paginación y búsqueda opcional."""
    try:
        usuarios, total = await list_usuarios(db, search=search, page=page, page_size=page_size)
        total_pages = max(1, (total + page_size - 1) // page_size)
        return PaginatedUsersResponse(
            items=[UserOut.model_validate(u) for u in usuarios],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/usuarios/{usuario_id}", response_model=UserOut, tags=["Admin"])
async def op_get_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Obtiene los datos de un usuario por ID."""
    try:
        usuario = await get_usuario_by_id(db, usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        return UserOut.model_validate(usuario)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/usuarios", response_model=UserOut, status_code=201, tags=["Admin"])
async def op_create_usuario(
    data: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Crea un nuevo usuario."""
    try:
        # Validate role
        if data.rol not in ["administrador", "vendedor", "almacen"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rol inválido. Los roles válidos son: administrador, vendedor, almacen",
            )

        # Check email uniqueness
        existing = await get_usuario_by_email(db, data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado",
            )

        usuario = await create_usuario(db, data.model_dump())
        return UserOut.model_validate(usuario)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/usuarios/{usuario_id}", response_model=UserOut, tags=["Admin"])
async def op_update_usuario(
    usuario_id: int,
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Actualiza los datos de un usuario."""
    try:
        usuario = await get_usuario_by_id(db, usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        # Check email uniqueness if changing email
        if data.email and data.email != usuario.email:
            existing = await get_usuario_by_email(db, data.email)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El correo electrónico ya está registrado",
                )

        # Validate role if provided
        if data.rol and data.rol not in ["administrador", "vendedor", "almacen"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rol inválido. Los roles válidos son: administrador, vendedor, almacen",
            )

        usuario = await update_usuario(db, usuario, data.model_dump(exclude_unset=True))
        return UserOut.model_validate(usuario)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/usuarios/{usuario_id}/deactivate", response_model=UserActionResponse, tags=["Admin"])
async def op_deactivate_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Desactiva un usuario (lo marca como inactivo e invalida sus tokens)."""
    try:
        if usuario_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No puedes desactivar tu propia cuenta",
            )

        usuario = await get_usuario_by_id(db, usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        usuario = await deactivate_usuario(db, usuario)
        return UserActionResponse(
            mensaje="Usuario desactivado exitosamente",
            usuario=UserOut.model_validate(usuario),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/usuarios/{usuario_id}/reactivate", response_model=UserActionResponse, tags=["Admin"])
async def op_reactivate_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Reactivar un usuario."""
    try:
        usuario = await get_usuario_by_id(db, usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        usuario = await reactivate_usuario(db, usuario)
        return UserActionResponse(
            mensaje="Usuario reactivado exitosamente",
            usuario=UserOut.model_validate(usuario),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ───────────────────────────────────────────────────────
# Endpoints Protegidos — Perfil y Preferencias
# ───────────────────────────────────────────────────────

@router.get("/perfil", response_model=PerfilResponse, tags=["Perfil"])
async def op_get_perfil(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obtiene el perfil completo del usuario autenticado (datos + preferencias)."""
    try:
        preferencias = await get_preferencias(db, current_user.id)
        if not preferencias:
            preferencias_data = PreferenciasOut()
        else:
            preferencias_data = PreferenciasOut.model_validate(preferencias)

        return PerfilResponse(
            usuario=UserOut.model_validate(current_user),
            preferencias=preferencias_data,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/perfil", response_model=UserOut, tags=["Perfil"])
async def op_update_perfil(
    data: UserUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Actualiza los datos del perfil del usuario autenticado."""
    try:
        # Check email uniqueness if changing email
        if data.email and data.email != current_user.email:
            existing = await get_usuario_by_email(db, data.email)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El correo electrónico ya está registrado",
                )

        usuario = await update_usuario(db, current_user, data.model_dump(exclude_unset=True))
        return UserOut.model_validate(usuario)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/perfil/cambiar-password", response_model=ChangePasswordResponse, tags=["Perfil"])
async def op_change_password(
    data: ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cambia la contraseña del usuario autenticado."""
    try:
        # Validate passwords match
        if data.new_password != data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Las contraseñas nuevas no coinciden",
            )

        success = await change_user_password(db, current_user, data.current_password, data.new_password)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña actual es incorrecta",
            )

        return ChangePasswordResponse(mensaje="Contraseña cambiada exitosamente")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/perfil/preferencias", response_model=PreferenciasOut, tags=["Perfil"])
async def op_get_preferencias(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obtiene las preferencias del usuario autenticado."""
    try:
        preferencias = await get_preferencias(db, current_user.id)
        if not preferencias:
            return PreferenciasOut()
        return PreferenciasOut.model_validate(preferencias)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/perfil/preferencias", response_model=PreferenciasOut, tags=["Perfil"])
async def op_update_preferencias(
    data: PreferenciasUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Actualiza las preferencias del usuario autenticado."""
    try:
        preferencias = await update_preferencias(db, current_user.id, data.model_dump(exclude_unset=True))
        return PreferenciasOut.model_validate(preferencias)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
