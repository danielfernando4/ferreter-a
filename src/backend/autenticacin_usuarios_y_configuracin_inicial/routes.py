"""API routes for Autenticación, Usuarios y Configuración Inicial."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
    PaginatedUsersResponse,
    UserActionResponse,
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
    get_usuario,
    create_usuario,
    update_usuario,
    deactivate_usuario,
    reactivate_usuario,
    get_perfil,
    update_perfil,
    change_user_password,
    get_preferencias,
    update_preferencias,
)
from .dependencies import get_current_user, require_admin
from .models import Usuario

router = APIRouter()


async def _get_user_out_safe(db: AsyncSession, user: Usuario) -> UserOut:
    """Safely convert a Usuario to UserOut, loading relationship if needed."""
    if not user.rol:
        result = await db.execute(
            select(Usuario)
            .options(selectinload(Usuario.rol))
            .where(Usuario.id == user.id)
        )
        user = result.scalar_one()
    return UserOut.model_validate(user)


# ─── Endpoints Públicos ───────────────────────────────────────────────────────

@router.get("/auth/check-setup", response_model=SetupStatusResponse)
async def op_check_setup(db: AsyncSession = Depends(get_db)):
    """Check if the initial setup has been completed."""
    status_data = await check_setup_status(db)
    return SetupStatusResponse(**status_data)


@router.post("/auth/setup", response_model=SetupResponse, status_code=status.HTTP_201_CREATED)
async def op_run_setup(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Execute the initial setup wizard."""
    try:
        mensaje, user = await run_setup(db, data)
        user_out = await _get_user_out_safe(db, user)
        return SetupResponse(mensaje=mensaje, usuario=user_out)
    except ValueError as e:
        err_msg = str(e)
        if err_msg == "SETUP_ALREADY_COMPLETED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"codigo": "SETUP_ALREADY_COMPLETED", "mensaje": "La configuración inicial ya fue completada"},
            )
        if err_msg == "INVALID_DATA":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"codigo": "INVALID_DATA", "mensaje": "El correo electrónico ya está registrado o datos inválidos"},
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"codigo": "INVALID_DATA", "mensaje": str(e)},
        )


@router.post("/auth/login", response_model=LoginResponse)
async def op_login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return a session token."""
    try:
        result = await login_user(db, data.email, data.password, data.remember)
        return LoginResponse(**result)
    except ValueError as e:
        if str(e) == "INVALID_CREDENTIALS":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"codigo": "INVALID_CREDENTIALS", "mensaje": "Credenciales inválidas"},
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"codigo": "ERROR", "mensaje": str(e)},
        )


@router.post("/auth/forgot-password", response_model=ForgotPasswordResponse)
async def op_forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset token. Always returns success."""
    await forgot_password(db, data.email)
    return ForgotPasswordResponse(mensaje="Si el correo está registrado, recibirás un enlace de recuperación")


@router.get("/auth/verify-reset-token/{token}", response_model=VerifyTokenResponse)
async def op_verify_reset_token(token: str, db: AsyncSession = Depends(get_db)):
    """Verify if a password reset token is valid."""
    try:
        result = await verify_reset_token(db, token)
        return VerifyTokenResponse(**result)
    except ValueError as e:
        err_msg = str(e)
        if err_msg == "TOKEN_NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"codigo": "TOKEN_NOT_FOUND", "mensaje": "Token no encontrado"},
            )
        if err_msg == "TOKEN_EXPIRED":
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail={"codigo": "TOKEN_EXPIRED", "mensaje": "El token ha expirado"},
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"codigo": "ERROR", "mensaje": str(e)},
        )


@router.post("/auth/reset-password", response_model=ResetPasswordResponse)
async def op_reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset a password using a valid reset token."""
    try:
        mensaje = await reset_password(db, data.token, data.new_password, data.confirm_password)
        return ResetPasswordResponse(mensaje=mensaje)
    except ValueError as e:
        err_msg = str(e)
        if err_msg == "PASSWORDS_DONT_MATCH":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"codigo": "PASSWORDS_DONT_MATCH", "mensaje": "Las contraseñas no coinciden"},
            )
        if err_msg == "TOKEN_INVALID_OR_EXPIRED":
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail={"codigo": "TOKEN_INVALID_OR_EXPIRED", "mensaje": "Token inválido o expirado"},
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"codigo": "ERROR", "mensaje": str(e)},
        )


# ─── Endpoints Protegidos (Autenticación) ─────────────────────────────────────

@router.get("/auth/me", response_model=UserOut)
async def op_me(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current authenticated user's profile."""
    return await _get_user_out_safe(db, current_user)


@router.post("/auth/logout", response_model=LogoutResponse)
async def op_logout(
    request: Request,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout by invalidating the current session token."""
    auth_header = request.headers.get("Authorization", "")
    raw_token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else ""
    if raw_token:
        await logout_user(db, current_user, raw_token)
    return LogoutResponse(mensaje="Sesión cerrada exitosamente")


# ─── Endpoints Protegidos (Admin - Gestión de Usuarios) ──────────────────────

@router.get("/usuarios", response_model=PaginatedUsersResponse)
async def op_list_usuarios(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with optional search and pagination (admin only)."""
    return await list_usuarios(db, search, page, page_size)


@router.get("/usuarios/{user_id}", response_model=UserOut)
async def op_get_usuario(
    user_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user by ID (admin only)."""
    try:
        user = await get_usuario(db, user_id)
        return await _get_user_out_safe(db, user)
    except ValueError as e:
        if str(e) == "NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"codigo": "NOT_FOUND", "mensaje": "Usuario no encontrado"},
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"codigo": "ERROR", "mensaje": str(e)},
        )


@router.post("/usuarios", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def op_create_usuario(
    data: UserCreateRequest,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user (admin only)."""
    try:
        user = await create_usuario(db, data)
        return await _get_user_out_safe(db, user)
    except ValueError as e:
        err_msg = str(e)
        if err_msg == "EMAIL_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"codigo": "EMAIL_EXISTS", "mensaje": "El correo electrónico ya está registrado"},
            )
        if err_msg == "INVALID_DATA":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"codigo": "INVALID_DATA", "mensaje": "Datos inválidos o rol no encontrado"},
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"codigo": "ERROR", "mensaje": str(e)},
        )


@router.put("/usuarios/{user_id}", response_model=UserOut)
async def op_update_usuario(
    user_id: int,
    data: UserUpdateRequest,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing user (admin only)."""
    try:
        user = await update_usuario(db, user_id, data)
        return await _get_user_out_safe(db, user)
    except ValueError as e:
        err_msg = str(e)
        if err_msg == "NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"codigo": "NOT_FOUND", "mensaje": "Usuario no encontrado"},
            )
        if err_msg == "EMAIL_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"codigo": "EMAIL_EXISTS", "mensaje": "El correo electrónico ya está registrado"},
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"codigo": "ERROR", "mensaje": str(e)},
        )


@router.patch("/usuarios/{user_id}/deactivate", response_model=UserActionResponse)
async def op_deactivate_usuario(
    user_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a user (admin only, cannot deactivate self)."""
    try:
        user = await deactivate_usuario(db, user_id, current_user.id)
        user_out = await _get_user_out_safe(db, user)
        return UserActionResponse(mensaje="Usuario desactivado exitosamente", usuario=user_out)
    except ValueError as e:
        err_msg = str(e)
        if err_msg == "NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"codigo": "NOT_FOUND", "mensaje": "Usuario no encontrado"},
            )
        if err_msg == "CANNOT_DEACTIVATE_SELF":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"codigo": "CANNOT_DEACTIVATE_SELF", "mensaje": "No puedes desactivar tu propia cuenta"},
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"codigo": "ERROR", "mensaje": str(e)},
        )


@router.patch("/usuarios/{user_id}/reactivate", response_model=UserActionResponse)
async def op_reactivate_usuario(
    user_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reactivate a deactivated user (admin only)."""
    try:
        user = await reactivate_usuario(db, user_id)
        user_out = await _get_user_out_safe(db, user)
        return UserActionResponse(mensaje="Usuario reactivado exitosamente", usuario=user_out)
    except ValueError as e:
        if str(e) == "NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"codigo": "NOT_FOUND", "mensaje": "Usuario no encontrado"},
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"codigo": "ERROR", "mensaje": str(e)},
        )


# ─── Endpoints Protegidos (Perfil y Preferencias) ─────────────────────────────

@router.get("/perfil", response_model=PerfilResponse)
async def op_get_perfil(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's profile and preferences."""
    return await get_perfil(db, current_user)


@router.put("/perfil", response_model=UserOut)
async def op_update_perfil(
    data: UserUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile (name, email)."""
    try:
        user = await update_perfil(db, current_user, data.nombre_completo, data.email)
        return await _get_user_out_safe(db, user)
    except ValueError as e:
        if str(e) == "EMAIL_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"codigo": "EMAIL_EXISTS", "mensaje": "El correo electrónico ya está registrado"},
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"codigo": "INVALID_DATA", "mensaje": str(e)},
        )


@router.put("/perfil/cambiar-password", response_model=ChangePasswordResponse)
async def op_change_password(
    data: ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the current user's password."""
    try:
        mensaje = await change_user_password(
            db, current_user, data.current_password, data.new_password, data.confirm_password
        )
        return ChangePasswordResponse(mensaje=mensaje)
    except ValueError as e:
        err_msg = str(e)
        if err_msg == "PASSWORDS_DONT_MATCH":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"codigo": "PASSWORDS_DONT_MATCH", "mensaje": "Las contraseñas nuevas no coinciden"},
            )
        if err_msg == "INVALID_CURRENT_PASSWORD":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"codigo": "INVALID_CURRENT_PASSWORD", "mensaje": "La contraseña actual es incorrecta"},
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"codigo": "ERROR", "mensaje": str(e)},
        )


@router.get("/perfil/preferencias", response_model=PreferenciasOut)
async def op_get_preferencias(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's preferences."""
    return await get_preferencias(db, current_user)


@router.put("/perfil/preferencias", response_model=PreferenciasOut)
async def op_update_preferencias(
    data: PreferenciasUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's preferences."""
    try:
        return await update_preferencias(db, current_user, data.idioma, data.tema_visual, data.zona_horaria)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"codigo": "INVALID_DATA", "mensaje": str(e)},
        )
