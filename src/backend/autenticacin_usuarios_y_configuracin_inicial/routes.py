from typing import Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from autenticacin_usuarios_y_configuracin_inicial.dependencies import (
    get_current_user,
    get_current_user_and_token,
    require_admin,
)
from autenticacin_usuarios_y_configuracin_inicial.models import TokenRestablecimiento, TokenSesion, Usuario
from autenticacin_usuarios_y_configuracin_inicial.utils import hash_token
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
    change_password,
    check_setup_status,
    create_reset_token,
    create_session_token,
    create_usuario,
    deactivate_usuario,
    get_preferencias,
    get_usuario_by_email,
    get_usuario_by_id,
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

TOKEN_EXPIRY_DEFAULT = 604800  # 7 days in seconds
TOKEN_EXPIRY_REMEMBER = 2592000  # 30 days in seconds


# ─── Endpoints Públicos ─────────────────────────────────────

@router.get("/auth/check-setup", response_model=SetupStatusResponse)
async def op_check_setup(db: AsyncSession = Depends(get_db)):
    """Check if the system has been set up."""
    setup_completed, admin_exists = await check_setup_status(db)
    return SetupStatusResponse(
        setup_completed=setup_completed,
        admin_exists=admin_exists,
    )


@router.post("/auth/setup", response_model=SetupResponse)
async def op_run_setup(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Run the initial setup wizard."""
    setup_completed, admin_exists = await check_setup_status(db)

    if setup_completed or admin_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SETUP_ALREADY_COMPLETED",
        )

    # Check email uniqueness
    existing = await get_usuario_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_DATA",
        )

    try:
        user = await run_setup(db, data.model_dump())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_DATA",
        )

    return SetupResponse(
        mensaje="Configuración inicial completada exitosamente",
        usuario=UserOut.model_validate(user),
    )


@router.post("/auth/login", response_model=LoginResponse)
async def op_login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return a session token."""
    user = await authenticate_user(db, data.email, data.password)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="INVALID_CREDENTIALS",
        )

    token_str = await create_session_token(db, user, remember=data.remember)
    expires_in = TOKEN_EXPIRY_REMEMBER if data.remember else TOKEN_EXPIRY_DEFAULT

    return LoginResponse(
        token=token_str,
        token_type="bearer",
        expires_in=expires_in,
        usuario=UserOut.model_validate(user),
    )


@router.post("/auth/forgot-password", response_model=ForgotPasswordResponse)
async def op_forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset token. Always returns success to prevent email enumeration."""
    token_str = await create_reset_token(db, data.email)
    # In a real system, send email with the token here
    return ForgotPasswordResponse(
        mensaje="Si el correo está registrado, recibirás un enlace de recuperación",
    )


@router.get("/auth/verify-reset-token/{token}", response_model=VerifyTokenResponse)
async def op_verify_reset_token(token: str, db: AsyncSession = Depends(get_db)):
    """Verify if a reset token is valid."""
    email = await verify_reset_token(db, token)

    if email is None:
        # Check if token exists but is expired
        token_hashed = hash_token(token)
        result = await db.execute(
            select(TokenRestablecimiento)
            .options(selectinload(TokenRestablecimiento.usuario))
            .where(TokenRestablecimiento.token_hash == token_hashed)
        )
        record = result.scalar_one_or_none()

        if record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="TOKEN_NOT_FOUND",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="TOKEN_EXPIRED",
            )

    return VerifyTokenResponse(valido=True, email=email)


@router.post("/auth/reset-password", response_model=ResetPasswordResponse)
async def op_reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a reset token."""
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PASSWORDS_DONT_MATCH",
        )

    success = await reset_password(db, data.token, data.new_password)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="TOKEN_INVALID_OR_EXPIRED",
        )

    return ResetPasswordResponse(mensaje="Contraseña restablecida exitosamente")


# ─── Endpoints Protegidos ───────────────────────────────────

@router.get("/auth/me", response_model=UserOut)
async def op_me(current_user: Usuario = Depends(get_current_user)):
    """Get the current authenticated user's data."""
    return UserOut.model_validate(current_user)


@router.post("/auth/logout", response_model=LogoutResponse)
async def op_logout(
    db: AsyncSession = Depends(get_db),
    auth_data: Tuple[Usuario, TokenSesion] = Depends(get_current_user_and_token),
):
    """Logout the current user by invalidating their token."""
    _user, token_record = auth_data
    token_record.activo = False
    await db.commit()

    return LogoutResponse(mensaje="Sesión cerrada exitosamente")


# ─── Gestión de Usuarios (Admin) ────────────────────────────

@router.get("/usuarios", response_model=PaginatedUsersResponse)
async def op_list_usuarios(
    search: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    admin: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with optional search and pagination. Admin only."""
    users, total = await list_usuarios(db, search=search, page=page, page_size=page_size)
    total_pages = max(1, (total + page_size - 1) // page_size)

    return PaginatedUsersResponse(
        items=[UserOut.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/usuarios/{user_id}", response_model=UserOut)
async def op_get_usuario(
    user_id: int,
    admin: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user by ID. Admin only."""
    user = await get_usuario_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND",
        )
    return UserOut.model_validate(user)


@router.post("/usuarios", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def op_create_usuario(
    data: UserCreateRequest,
    admin: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user. Admin only."""
    # Check email uniqueness
    existing = await get_usuario_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="EMAIL_EXISTS",
        )

    try:
        user = await create_usuario(db, data.model_dump())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_DATA",
        )

    return UserOut.model_validate(user)


@router.put("/usuarios/{user_id}", response_model=UserOut)
async def op_update_usuario(
    user_id: int,
    data: UserUpdateRequest,
    admin: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's data. Admin only."""
    user = await get_usuario_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND",
        )

    # Check email uniqueness if being changed
    if data.email is not None and data.email != user.email:
        existing = await get_usuario_by_email(db, data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="EMAIL_EXISTS",
            )

    updated_user = await update_usuario(db, user_id, data.model_dump(exclude_unset=True))
    return UserOut.model_validate(updated_user)


@router.patch("/usuarios/{user_id}/deactivate", response_model=UserActionResponse)
async def op_deactivate_usuario(
    user_id: int,
    admin: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a user. Admin only. Cannot deactivate self."""
    if admin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="CANNOT_DEACTIVATE_SELF",
        )

    user = await deactivate_usuario(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND",
        )

    return UserActionResponse(
        mensaje="Usuario desactivado exitosamente",
        usuario=UserOut.model_validate(user),
    )


@router.patch("/usuarios/{user_id}/reactivate", response_model=UserActionResponse)
async def op_reactivate_usuario(
    user_id: int,
    admin: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reactivate a deactivated user. Admin only."""
    user = await reactivate_usuario(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND",
        )

    return UserActionResponse(
        mensaje="Usuario reactivado exitosamente",
        usuario=UserOut.model_validate(user),
    )


# ─── Perfil ──────────────────────────────────────────────────

@router.get("/perfil", response_model=PerfilResponse)
async def op_get_perfil(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's profile and preferences."""
    pref = await get_preferencias(db, current_user)
    return PerfilResponse(
        usuario=UserOut.model_validate(current_user),
        preferencias=PreferenciasOut.model_validate(pref),
    )


@router.put("/perfil", response_model=UserOut)
async def op_update_perfil(
    data: UserUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile."""
    update_data = data.model_dump(exclude_unset=True)

    # Check email uniqueness if being changed
    if "email" in update_data and update_data["email"] != current_user.email:
        existing = await get_usuario_by_email(db, update_data["email"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="EMAIL_EXISTS",
            )

    user = await update_perfil(db, current_user, update_data)
    return UserOut.model_validate(user)


@router.put("/perfil/cambiar-password", response_model=ChangePasswordResponse)
async def op_change_password(
    data: ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the current user's password."""
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PASSWORDS_DONT_MATCH",
        )

    success = await change_password(db, current_user, data.current_password, data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_CURRENT_PASSWORD",
        )

    return ChangePasswordResponse(mensaje="Contraseña cambiada exitosamente")


@router.get("/perfil/preferencias", response_model=PreferenciasOut)
async def op_get_preferencias(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's preferences."""
    pref = await get_preferencias(db, current_user)
    return PreferenciasOut.model_validate(pref)


@router.put("/perfil/preferencias", response_model=PreferenciasOut)
async def op_update_preferencias(
    data: PreferenciasUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's preferences."""
    update_data = data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_DATA",
        )

    pref = await update_preferencias(db, current_user, update_data)
    return PreferenciasOut.model_validate(pref)
