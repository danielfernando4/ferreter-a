import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

from . import models as mdl
from . import schemas as sch
from .dependencies import get_current_user, require_admin
from .service import (
    actualizar_perfil,
    actualizar_preferencias,
    actualizar_usuario,
    autenticar_usuario,
    cambiar_password,
    crear_token_restablecimiento,
    crear_usuario,
    desactivar_usuario,
    ejecutar_setup,
    invalidar_tokens_usuario,
    listar_usuarios,
    obtener_perfil_completo,
    obtener_preferencias,
    obtener_usuario_por_id,
    reactivar_usuario,
    restablecer_password,
    verificar_estado_setup,
    verificar_token_restablecimiento,
)

router = APIRouter(tags=["Autenticación, Usuarios y Configuración Inicial"])


# ─── Endpoints Públicos (Sin autenticación) ─────────────────────────────────

@router.get("/auth/check-setup", response_model=sch.SetupStatusResponse)
async def check_setup(db: AsyncSession = Depends(get_db)):
    """Verifica si el sistema ya fue configurado y si existe un admin."""
    try:
        setup_completed, admin_exists = await verificar_estado_setup(db)
        return sch.SetupStatusResponse(
            setup_completed=setup_completed,
            admin_exists=admin_exists,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/auth/setup", response_model=sch.SetupResponse)
async def run_setup(
    data: sch.SetupRequest,
    db: AsyncSession = Depends(get_db),
):
    """Ejecuta la configuración inicial del sistema (setup wizard)."""
    try:
        usuario = await ejecutar_setup(db, data)
        return sch.SetupResponse(
            mensaje="Configuración inicial completada exitosamente",
            usuario=usuario,
        )
    except ValueError as e:
        msg = str(e)
        if msg == "SETUP_ALREADY_COMPLETED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="La configuración inicial ya fue completada",
            )
        if msg == "EMAIL_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )


@router.post("/auth/login", response_model=sch.LoginResponse)
async def login(
    data: sch.LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Inicia sesión con credenciales de usuario."""
    try:
        token, expires_in, usuario = await autenticar_usuario(
            db, data.email, data.password, data.remember,
        )
        return sch.LoginResponse(
            token=token,
            token_type="bearer",
            expires_in=expires_in,
            usuario=usuario,
        )
    except ValueError as e:
        if str(e) == "INVALID_CREDENTIALS":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/auth/forgot-password", response_model=sch.ForgotPasswordResponse)
async def forgot_password(
    data: sch.ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Solicita un enlace de restablecimiento de contraseña."""
    token = await crear_token_restablecimiento(db, data.email)
    # En producción enviar correo con el token
    # Por ahora devolvemos mensaje genérico
    return sch.ForgotPasswordResponse(
        mensaje="Si el correo está registrado, recibirás un enlace de restablecimiento",
    )


@router.get(
    "/auth/verify-reset-token/{token}",
    response_model=sch.VerifyTokenResponse,
)
async def verify_reset_token(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Verifica si un token de restablecimiento es válido."""
    usuario = await verificar_token_restablecimiento(db, token)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token no encontrado o expirado",
        )
    return sch.VerifyTokenResponse(valido=True, email=usuario.email)


@router.post("/auth/reset-password", response_model=sch.ResetPasswordResponse)
async def reset_password(
    data: sch.ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Restablece la contraseña usando un token de recuperación."""
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden",
        )

    usuario = await restablecer_password(db, data.token, data.new_password)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Token inválido o expirado",
        )

    return sch.ResetPasswordResponse(
        mensaje="Contraseña restablecida exitosamente",
    )


# ─── Endpoints Protegidos (Requieren autenticación) ─────────────────────────

@router.get("/auth/me", response_model=sch.UserOut)
async def get_me(current_user: mdl.Usuario = Depends(get_current_user)):
    """Obtiene la información del usuario autenticado."""
    return current_user


@router.post("/auth/logout", response_model=sch.LogoutResponse)
async def logout(
    db: AsyncSession = Depends(get_db),
    current_user: mdl.Usuario = Depends(get_current_user),
):
    """Cierra la sesión del usuario autenticado."""
    # Invalidamos todos los tokens del usuario para cerrar sesión
    await invalidar_tokens_usuario(db, current_user.id)
    return sch.LogoutResponse(mensaje="Sesión cerrada exitosamente")


# ─── Gestión de Usuarios (Solo Admin) ──────────────────────────────────────

@router.get("/usuarios", response_model=sch.PaginatedUsersResponse)
async def list_usuarios(
    search: str = Query(None, description="Búsqueda por nombre o email"),
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=100, description="Elementos por página"),
    db: AsyncSession = Depends(get_db),
    current_user: mdl.Usuario = Depends(require_admin),
):
    """Lista todos los usuarios con paginación y búsqueda opcional."""
    usuarios, total = await listar_usuarios(db, search, page, page_size)
    total_pages = max(1, math.ceil(total / page_size))

    return sch.PaginatedUsersResponse(
        items=[sch.UserOut.model_validate(u) for u in usuarios],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/usuarios/{usuario_id}", response_model=sch.UserOut)
async def get_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: mdl.Usuario = Depends(require_admin),
):
    """Obtiene un usuario por su ID."""
    usuario = await obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    return usuario


@router.post("/usuarios", response_model=sch.UserOut, status_code=status.HTTP_201_CREATED)
async def create_usuario(
    data: sch.UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: mdl.Usuario = Depends(require_admin),
):
    """Crea un nuevo usuario."""
    try:
        usuario = await crear_usuario(db, data)
        return usuario
    except ValueError as e:
        msg = str(e)
        if msg == "EMAIL_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado",
            )
        if msg == "INVALID_ROLE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rol inválido",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )


@router.put("/usuarios/{usuario_id}", response_model=sch.UserOut)
async def update_usuario(
    usuario_id: int,
    data: sch.UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: mdl.Usuario = Depends(require_admin),
):
    """Actualiza los datos de un usuario."""
    try:
        usuario = await actualizar_usuario(db, usuario_id, data)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        return usuario
    except ValueError as e:
        msg = str(e)
        if msg == "EMAIL_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado",
            )
        if msg == "INVALID_ROLE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rol inválido",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )


@router.patch("/usuarios/{usuario_id}/deactivate", response_model=sch.UserActionResponse)
async def deactivate_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: mdl.Usuario = Depends(require_admin),
):
    """Desactiva un usuario."""
    if usuario_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No puedes desactivar tu propia cuenta",
        )

    usuario = await desactivar_usuario(db, usuario_id)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    return sch.UserActionResponse(
        mensaje="Usuario desactivado exitosamente",
        usuario=usuario,
    )


@router.patch("/usuarios/{usuario_id}/reactivate", response_model=sch.UserActionResponse)
async def reactivate_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: mdl.Usuario = Depends(require_admin),
):
    """Reactivar un usuario desactivado."""
    usuario = await reactivar_usuario(db, usuario_id)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    return sch.UserActionResponse(
        mensaje="Usuario reactivado exitosamente",
        usuario=usuario,
    )


# ─── Perfil del Usuario ─────────────────────────────────────────────────────

@router.get("/perfil", response_model=sch.PerfilResponse)
async def get_perfil(
    db: AsyncSession = Depends(get_db),
    current_user: mdl.Usuario = Depends(get_current_user),
):
    """Obtiene el perfil completo del usuario autenticado."""
    usuario, preferencias = await obtener_perfil_completo(db, current_user.id)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    pref_out = sch.PreferenciasOut(
        idioma=preferencias.idioma if preferencias else "es",
        tema_visual=preferencias.tema_visual if preferencias else "light",
        zona_horaria=preferencias.configuracion_regional if preferencias else "America/Mexico_City",
    )

    return sch.PerfilResponse(usuario=usuario, preferencias=pref_out)


@router.put("/perfil", response_model=sch.UserOut)
async def update_perfil(
    data: sch.UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: mdl.Usuario = Depends(get_current_user),
):
    """Actualiza el perfil del usuario autenticado."""
    try:
        usuario = await actualizar_perfil(db, current_user.id, data)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        return usuario
    except ValueError as e:
        msg = str(e)
        if msg == "EMAIL_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )


@router.put("/perfil/cambiar-password", response_model=sch.ChangePasswordResponse)
async def change_password(
    data: sch.ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: mdl.Usuario = Depends(get_current_user),
):
    """Cambia la contraseña del usuario autenticado."""
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden",
        )

    try:
        success = await cambiar_password(
            db, current_user.id, data.current_password, data.new_password,
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        return sch.ChangePasswordResponse(
            mensaje="Contraseña cambiada exitosamente",
        )
    except ValueError as e:
        if str(e) == "INVALID_CURRENT_PASSWORD":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña actual es incorrecta",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/perfil/preferencias", response_model=sch.PreferenciasOut)
async def get_preferencias(
    db: AsyncSession = Depends(get_db),
    current_user: mdl.Usuario = Depends(get_current_user),
):
    """Obtiene las preferencias del usuario autenticado."""
    preferencias = await obtener_preferencias(db, current_user.id)
    if not preferencias:
        return sch.PreferenciasOut(
            idioma="es",
            tema_visual="light",
            zona_horaria="America/Mexico_City",
        )

    return sch.PreferenciasOut(
        idioma=preferencias.idioma,
        tema_visual=preferencias.tema_visual,
        zona_horaria=preferencias.configuracion_regional,
    )


@router.put("/perfil/preferencias", response_model=sch.PreferenciasOut)
async def update_preferencias(
    data: sch.PreferenciasUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: mdl.Usuario = Depends(get_current_user),
):
    """Actualiza las preferencias del usuario autenticado."""
    try:
        preferencias = await actualizar_preferencias(db, current_user.id, data)
        if not preferencias:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preferencias no encontradas",
            )

        return sch.PreferenciasOut(
            idioma=preferencias.idioma,
            tema_visual=preferencias.tema_visual,
            zona_horaria=preferencias.configuracion_regional,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
