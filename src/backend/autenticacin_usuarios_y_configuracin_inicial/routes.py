from fastapi import APIRouter, Depends, HTTPException, Query, status
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
    authenticate_user,
    change_password,
    check_setup_status,
    create_reset_token,
    create_session_token,
    create_usuario,
    deactivate_usuario,
    get_perfil_completo,
    get_preferencias,
    get_usuario_by_id,
    invalidate_token,
    list_usuarios,
    reactivate_usuario,
    reset_password,
    run_setup,
    update_preferencias,
    update_profile,
    update_usuario,
    verify_reset_token,
)
from .utils import get_token_expires_in

router = APIRouter()


# ══════════════════════════════════════════════════════════════════════════
# ENDPOINTS PÚBLICOS
# ══════════════════════════════════════════════════════════════════════════


@router.get("/api/auth/check-setup", response_model=SetupStatusResponse)
async def check_setup(db: AsyncSession = Depends(get_db)):
    """Check if the system setup has been completed."""
    status_info = await check_setup_status(db)
    return status_info


@router.post("/api/auth/setup", response_model=SetupResponse, status_code=status.HTTP_201_CREATED)
async def setup_initial(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Run the initial setup wizard."""
    try:
        result = await run_setup(db, data)
        return SetupResponse(mensaje="Configuración inicial completada exitosamente", usuario=UserOut.model_validate(result["usuario"]))
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "SETUP_ALREADY_COMPLETED":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SETUP_ALREADY_COMPLETED")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.post("/api/auth/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT token."""
    result = await authenticate_user(db, data.email, data.password)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    usuario = result["usuario"]

    # Create session token
    token = await create_session_token(db, usuario.id, data.remember)
    expires_in = get_token_expires_in(token)

    return LoginResponse(
        token=token,
        expires_in=expires_in,
        usuario=UserOut.model_validate(usuario),
    )


@router.post("/api/auth/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset token. Always returns success to avoid email enumeration."""
    await create_reset_token(db, data.email)
    return ForgotPasswordResponse(mensaje="Si el correo está registrado, recibirás un enlace de restablecimiento")


@router.get("/api/auth/verify-reset-token/{token}", response_model=VerifyTokenResponse)
async def verify_reset_token_endpoint(token: str, db: AsyncSession = Depends(get_db)):
    """Verify if a reset token is valid."""
    result = await verify_reset_token(db, token)
    if not result["valido"]:
        if result.get("expired"):
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="TOKEN_EXPIRED")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TOKEN_NOT_FOUND")
    return VerifyTokenResponse(valido=True, email=result["email"])


@router.post("/api/auth/reset-password", response_model=ResetPasswordResponse)
async def reset_password_endpoint(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid token."""
    try:
        mensaje = await reset_password(db, data.token, data.new_password, data.confirm_password)
        return ResetPasswordResponse(mensaje=mensaje)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "PASSWORDS_DONT_MATCH":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PASSWORDS_DONT_MATCH")
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="TOKEN_INVALID_OR_EXPIRED")


# ══════════════════════════════════════════════════════════════════════════
# ENDPOINTS PROTEGIDOS - Auth
# ══════════════════════════════════════════════════════════════════════════


@router.get("/api/auth/me", response_model=UserOut)
async def get_me(current_user: Usuario = Depends(get_current_user)):
    """Get current authenticated user info."""
    return UserOut.model_validate(current_user)


@router.post("/api/auth/logout", response_model=LogoutResponse)
async def logout(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invalidate current session token."""
    from .service import invalidate_all_user_tokens
    await invalidate_all_user_tokens(db, current_user.id)
    return LogoutResponse(mensaje="Sesión cerrada exitosamente")


# ══════════════════════════════════════════════════════════════════════════
# ENDPOINTS PROTEGIDOS - Usuarios (Admin)
# ══════════════════════════════════════════════════════════════════════════


@router.get("/api/usuarios", response_model=PaginatedUsersResponse)
async def list_usuarios_endpoint(
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with pagination and optional search (admin only)."""
    result = await list_usuarios(db, search, page, page_size)
    return PaginatedUsersResponse(
        items=[UserOut.model_validate(u) for u in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
    )


@router.get("/api/usuarios/{usuario_id}", response_model=UserOut)
async def get_usuario_endpoint(
    usuario_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user by ID (admin only)."""
    usuario = await get_usuario_by_id(db, usuario_id)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")
    return UserOut.model_validate(usuario)


@router.post("/api/usuarios", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_usuario_endpoint(
    data: UserCreateRequest,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user (admin only)."""
    try:
        usuario = await create_usuario(db, data, current_user.id)
        return UserOut.model_validate(usuario)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "EMAIL_EXISTS":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_EXISTS")
        if error_msg == "INVALID_ROLE":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_ROLE")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.put("/api/usuarios/{usuario_id}", response_model=UserOut)
async def update_usuario_endpoint(
    usuario_id: int,
    data: UserUpdateRequest,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a user (admin only). Cannot change password."""
    try:
        usuario = await update_usuario(db, usuario_id, data)
        return UserOut.model_validate(usuario)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "NOT_FOUND":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")
        if error_msg == "EMAIL_EXISTS":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_EXISTS")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.patch("/api/usuarios/{usuario_id}/deactivate", response_model=UserActionResponse)
async def deactivate_usuario_endpoint(
    usuario_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a user (admin only). Cannot deactivate yourself."""
    try:
        usuario = await deactivate_usuario(db, usuario_id, current_user.id)
        return UserActionResponse(mensaje="Usuario desactivado exitosamente", usuario=UserOut.model_validate(usuario))
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "NOT_FOUND":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")
        if error_msg == "CANNOT_DEACTIVATE_SELF":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CANNOT_DEACTIVATE_SELF")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.patch("/api/usuarios/{usuario_id}/reactivate", response_model=UserActionResponse)
async def reactivate_usuario_endpoint(
    usuario_id: int,
    current_user: Usuario = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reactivate a deactivated user (admin only)."""
    try:
        usuario = await reactivate_usuario(db, usuario_id)
        return UserActionResponse(mensaje="Usuario reactivado exitosamente", usuario=UserOut.model_validate(usuario))
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "NOT_FOUND":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


# ══════════════════════════════════════════════════════════════════════════
# ENDPOINTS PROTEGIDOS - Perfil
# ══════════════════════════════════════════════════════════════════════════


@router.get("/api/perfil", response_model=PerfilResponse)
async def get_perfil(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user profile with preferences."""
    try:
        result = await get_perfil_completo(db, current_user.id)
        return PerfilResponse(
            usuario=UserOut.model_validate(result["usuario"]),
            preferencias=PreferenciasOut.model_validate(result["preferencias"]),
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")


@router.put("/api/perfil", response_model=UserOut)
async def update_perfil(
    data: UserUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user profile."""
    try:
        usuario = await update_profile(db, current_user.id, data.nombre_completo, data.email)
        return UserOut.model_validate(usuario)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "EMAIL_EXISTS":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_EXISTS")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.put("/api/perfil/cambiar-password", response_model=ChangePasswordResponse)
async def cambiar_password(
    data: ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change current user password."""
    try:
        mensaje = await change_password(db, current_user.id, data)
        return ChangePasswordResponse(mensaje=mensaje)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "INVALID_CURRENT_PASSWORD":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_CURRENT_PASSWORD")
        if error_msg == "PASSWORDS_DONT_MATCH":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PASSWORDS_DONT_MATCH")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.get("/api/perfil/preferencias", response_model=PreferenciasOut)
async def get_preferencias_endpoint(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user preferences."""
    preferencias = await get_preferencias(db, current_user.id)
    if preferencias is None:
        # Return defaults
        return PreferenciasOut()
    return PreferenciasOut.model_validate(preferencias)


@router.put("/api/perfil/preferencias", response_model=PreferenciasOut)
async def update_preferencias_endpoint(
    data: PreferenciasUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user preferences."""
    try:
        preferencias = await update_preferencias(db, current_user.id, data)
        return PreferenciasOut.model_validate(preferencias)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_DATA")
