from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

from .dependencies import get_current_user, require_admin
from .models import ConfiguracionNegocio, Rol, TokenRestablecimiento, Usuario
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
    change_password,
    check_setup_status,
    create_reset_token,
    create_session_token,
    create_usuario,
    deactivate_usuario,
    get_preferencias,
    get_usuario_by_email,
    get_usuario_by_id,
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
from .utils import hash_token

router = APIRouter()


# ═══════════════════════════════════════════════════════
# ENDPOINTS PÚBLICOS (sin autenticación)
# ═══════════════════════════════════════════════════════


@router.get("/check-setup", response_model=SetupStatusResponse, tags=["Setup"])
async def check_setup(db: AsyncSession = Depends(get_db)):
    """Check if setup has been completed and if any admin exists."""
    status_data = await check_setup_status(db)
    return SetupStatusResponse(**status_data)


@router.post("/setup", response_model=SetupResponse, tags=["Setup"])
async def setup_initial(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Run the initial setup wizard."""
    user = await run_setup(db, data.model_dump())
    user_response = UserOut.model_validate(user)
    return SetupResponse(mensaje="Configuración inicial completada exitosamente.", usuario=user_response)


@router.post("/login", response_model=LoginResponse, tags=["Auth"])
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return a session token."""
    user = await authenticate_user(db, data.email, data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    token, expires_in = await create_session_token(db, user.id, persistent=data.remember)
    user_response = UserOut.model_validate(user)
    return LoginResponse(token=token, token_type="bearer", expires_in=expires_in, usuario=user_response)


@router.post("/forgot-password", response_model=ForgotPasswordResponse, tags=["Auth"])
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset link sent to email."""
    await create_reset_token(db, data.email)
    # Always return success to not reveal whether email exists
    return ForgotPasswordResponse(
        mensaje="Si el correo está registrado, recibirás un enlace de restablecimiento."
    )


@router.get("/verify-reset-token/{token}", response_model=VerifyTokenResponse, tags=["Auth"])
async def verify_reset_token_endpoint(token: str, db: AsyncSession = Depends(get_db)):
    """Verify if a reset token is valid."""
    result = await verify_reset_token(db, token)
    if result is None:
        # Check if token exists but is expired/used
        token_hashed = hash_token(token)
        existing = await db.execute(
            select(TokenRestablecimiento).where(
                TokenRestablecimiento.token_hash == token_hashed
            )
        )
        record = existing.scalar_one_or_none()
        if record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token no encontrado",
            )
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Token expirado o ya utilizado",
        )

    return VerifyTokenResponse(valido=True, email=result["email"])


@router.post("/reset-password", response_model=ResetPasswordResponse, tags=["Auth"])
async def reset_password_endpoint(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
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
            detail="Token inválido o expirado",
        )

    return ResetPasswordResponse(mensaje="Contraseña restablecida exitosamente.")


# ═══════════════════════════════════════════════════════
# ENDPOINTS PROTEGIDOS (requieren autenticación)
# ═══════════════════════════════════════════════════════


@router.get("/me", response_model=UserOut, tags=["Auth"])
async def get_me(current_user: Usuario = Depends(get_current_user)):
    """Get the profile of the currently authenticated user."""
    return UserOut.model_validate(current_user)


@router.post("/logout", response_model=LogoutResponse, tags=["Auth"])
async def logout(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout the current user by invalidating their token."""
    # The token is extracted via dependencies; we invalidate it via the dependency
    # We use the get_current_user dependency which already validates the token
    # For simplicity, we invalidate all tokens for the user
    from .service import invalidar_tokens_usuario

    await invalidar_tokens_usuario(db, current_user.id)
    return LogoutResponse(mensaje="Sesión cerrada exitosamente.")


# ═══════════════════════════════════════════════════════
# ENDPOINTS DE ADMINISTRACIÓN DE USUARIOS
# ═══════════════════════════════════════════════════════


@router.get("/usuarios", response_model=PaginatedUsersResponse, tags=["Admin"])
async def list_usuarios_endpoint(
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with pagination and optional search."""
    result = await list_usuarios(db, search=search, page=page, page_size=page_size)
    items = [UserOut.model_validate(u) for u in result["items"]]
    return PaginatedUsersResponse(
        items=items,
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
    )


@router.get("/usuarios/{usuario_id}", response_model=UserOut, tags=["Admin"])
async def get_usuario_endpoint(
    usuario_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a single user by ID."""
    user = await get_usuario_by_id(db, usuario_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    return UserOut.model_validate(user)


@router.post("/usuarios", response_model=UserOut, tags=["Admin"])
async def create_usuario_endpoint(
    data: UserCreateRequest,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user."""
    # Check email uniqueness
    existing = await get_usuario_by_email(db, data.email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo electrónico ya está registrado",
        )

    # Validate role
    valid_roles = ["administrador", "vendedor", "almacen"]
    if data.rol not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol no válido. Roles disponibles: {valid_roles}",
        )

    user = await create_usuario(db, data.model_dump())
    return UserOut.model_validate(user)


@router.put("/usuarios/{usuario_id}", response_model=UserOut, tags=["Admin"])
async def update_usuario_endpoint(
    usuario_id: int,
    data: UserUpdateRequest,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing user's data (name, email, role)."""
    # Check email uniqueness if email is being changed
    if data.email:
        existing = await get_usuario_by_email(db, data.email)
        if existing is not None and existing.id != usuario_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado por otro usuario",
            )

    # Validate role if provided
    if data.rol:
        valid_roles = ["administrador", "vendedor", "almacen"]
        if data.rol not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Rol no válido. Roles disponibles: {valid_roles}",
            )

    user = await update_usuario(db, usuario_id, data.model_dump(exclude_unset=True))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    return UserOut.model_validate(user)


@router.patch("/usuarios/{usuario_id}/deactivate", response_model=UserActionResponse, tags=["Admin"])
async def deactivate_usuario_endpoint(
    usuario_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a user. Cannot deactivate yourself."""
    if usuario_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No puedes desactivar tu propia cuenta",
        )

    user = await deactivate_usuario(db, usuario_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    return UserActionResponse(mensaje="Usuario desactivado exitosamente.", usuario=UserOut.model_validate(user))


@router.patch("/usuarios/{usuario_id}/reactivate", response_model=UserActionResponse, tags=["Admin"])
async def reactivate_usuario_endpoint(
    usuario_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reactivate a deactivated user."""
    user = await reactivate_usuario(db, usuario_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    return UserActionResponse(mensaje="Usuario reactivado exitosamente.", usuario=UserOut.model_validate(user))


# ═══════════════════════════════════════════════════════
# ENDPOINTS DE PERFIL Y PREFERENCIAS
# ═══════════════════════════════════════════════════════


@router.get("/perfil", response_model=PerfilResponse, tags=["Auth"])
async def get_perfil(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get profile and preferences of the current user."""
    user_response = UserOut.model_validate(current_user)
    pref = await get_preferencias(db, current_user.id)
    if pref is None:
        pref_out = PreferenciasOut()
    else:
        pref_out = PreferenciasOut(
            idioma=pref.idioma,
            tema_visual=pref.tema_visual,
            zona_horaria=pref.configuracion_regional,
        )
    return PerfilResponse(usuario=user_response, preferencias=pref_out)


@router.put("/perfil", response_model=UserOut, tags=["Auth"])
async def update_perfil_endpoint(
    data: UserUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile (name and email)."""
    # Check email uniqueness
    if data.email:
        existing = await get_usuario_by_email(db, data.email)
        if existing is not None and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado por otro usuario",
            )

    user = await update_perfil(db, current_user.id, data.model_dump(exclude_unset=True))
    return UserOut.model_validate(user)


@router.put("/perfil/cambiar-password", response_model=ChangePasswordResponse, tags=["Auth"])
async def cambiar_password_endpoint(
    data: ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the current user's password."""
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas nuevas no coinciden",
        )

    success = await change_password(db, current_user.id, data.current_password, data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta",
        )

    return ChangePasswordResponse(mensaje="Contraseña cambiada exitosamente.")


@router.get("/perfil/preferencias", response_model=PreferenciasOut, tags=["Auth"])
async def get_preferencias_endpoint(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's preferences."""
    pref = await get_preferencias(db, current_user.id)
    if pref is None:
        return PreferenciasOut()
    return PreferenciasOut(
        idioma=pref.idioma,
        tema_visual=pref.tema_visual,
        zona_horaria=pref.configuracion_regional,
    )


@router.put("/perfil/preferencias", response_model=PreferenciasOut, tags=["Auth"])
async def update_preferencias_endpoint(
    data: PreferenciasUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's preferences."""
    pref = await update_preferencias(db, current_user.id, data.model_dump(exclude_unset=True))
    return PreferenciasOut(
        idioma=pref.idioma,
        tema_visual=pref.tema_visual,
        zona_horaria=pref.configuracion_regional,
    )
