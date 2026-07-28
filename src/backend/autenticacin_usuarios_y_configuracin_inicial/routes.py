from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from autenticacin_usuarios_y_configuracin_inicial.schemas import (
    SetupStatusResponse,
    SetupRequest,
    SetupResponse,
    LoginRequest,
    LoginResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    VerifyTokenResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    ChangePasswordResponse,
    UserOut,
    UserCreateRequest,
    UserUpdateRequest,
    PaginatedUsersResponse,
    UserActionResponse,
    PerfilResponse,
    PreferenciasOut,
    PreferenciasUpdateRequest,
    LogoutResponse,
)
from autenticacin_usuarios_y_configuracin_inicial.dependencies import get_current_user, require_admin
from autenticacin_usuarios_y_configuracin_inicial.models import Usuario
from autenticacin_usuarios_y_configuracin_inicial import service as svc

router = APIRouter(tags=["Autenticación y Usuarios"])


# ───── Setup ─────

@router.get("/auth/check-setup", response_model=SetupStatusResponse)
async def check_setup(db: AsyncSession = Depends(get_db)):
    """Check if the system setup has been completed."""
    return await svc.check_setup_status(db)


@router.post("/auth/setup", response_model=SetupResponse, status_code=status.HTTP_201_CREATED)
async def run_setup(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Run the initial setup wizard."""
    try:
        mensaje, usuario = await svc.run_setup(db, data.model_dump())
        return SetupResponse(mensaje=mensaje, usuario=usuario)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "SETUP_ALREADY_COMPLETED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="La configuración inicial ya ha sido completada",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ───── Authentication ─────

@router.post("/auth/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return a session token."""
    try:
        result = await svc.authenticate_user(db, data.email, data.password, data.remember)
        return LoginResponse(**result)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "INVALID_CREDENTIALS":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
            )
        if error_msg == "USER_INACTIVE":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Cuenta de usuario desactivada",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/auth/me", response_model=UserOut)
async def get_me(current_user: Usuario = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return current_user


@router.post("/auth/logout", response_model=LogoutResponse)
async def logout(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Logout by invalidating the current session token."""
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            await svc.logout_user(db, parts[1])
    return LogoutResponse(mensaje="Sesión cerrada exitosamente")


# ───── Password Reset ─────

@router.post("/auth/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset token."""
    mensaje = await svc.forgot_password(db, data.email)
    return ForgotPasswordResponse(mensaje=mensaje)


@router.get("/auth/verify-reset-token/{token}", response_model=VerifyTokenResponse)
async def verify_reset_token(token: str, db: AsyncSession = Depends(get_db)):
    """Verify if a reset token is valid."""
    result = await svc.verify_reset_token(db, token)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token no encontrado",
        )
    return VerifyTokenResponse(valido=True, email=result["email"])


@router.post("/auth/reset-password", response_model=ResetPasswordResponse)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid reset token."""
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden",
        )
    try:
        mensaje = await svc.reset_password(db, data.token, data.new_password)
        return ResetPasswordResponse(mensaje=mensaje)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "TOKEN_INVALID_OR_EXPIRED":
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Token inválido o expirado",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ───── User Management (Admin) ─────

@router.get("/usuarios", response_model=PaginatedUsersResponse)
async def list_usuarios(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """List all users with pagination and optional search."""
    users, total = await svc.list_usuarios(db, search, page, page_size)
    total_pages = max(1, (total + page_size - 1) // page_size)
    return PaginatedUsersResponse(
        items=users,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/usuarios/{user_id}", response_model=UserOut)
async def get_usuario(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Get a single user by ID."""
    user = await svc.get_usuario(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    return user


@router.post("/usuarios", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_usuario(
    data: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Create a new user."""
    try:
        return await svc.create_usuario(db, data.model_dump())
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
async def update_usuario(
    user_id: int,
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Update an existing user."""
    try:
        return await svc.update_usuario(db, user_id, data.model_dump(exclude_none=True))
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
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
async def deactivate_usuario(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Deactivate a user account."""
    try:
        user = await svc.deactivate_usuario(db, user_id, current_user.id)
        return UserActionResponse(
            mensaje="Usuario desactivado exitosamente",
            usuario=user,
        )
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
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
async def reactivate_usuario(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Reactivate a user account."""
    try:
        user = await svc.reactivate_usuario(db, user_id)
        return UserActionResponse(
            mensaje="Usuario reactivado exitosamente",
            usuario=user,
        )
    except ValueError as e:
        if str(e) == "NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ───── Profile ─────

@router.get("/perfil", response_model=PerfilResponse)
async def get_perfil(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Get current user's profile and preferences."""
    return await svc.get_perfil(db, current_user)


@router.put("/perfil", response_model=UserOut)
async def update_perfil(
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Update current user's profile."""
    try:
        return await svc.update_perfil(db, current_user, data.model_dump(exclude_none=True))
    except ValueError as e:
        if str(e) == "EMAIL_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/perfil/cambiar-password", response_model=ChangePasswordResponse)
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Change current user's password."""
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden",
        )
    try:
        mensaje = await svc.change_password(db, current_user, data.current_password, data.new_password)
        return ChangePasswordResponse(mensaje=mensaje)
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


@router.get("/perfil/preferencias", response_model=PreferenciasOut)
async def get_preferencias(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Get current user's preferences."""
    pref = await svc.get_preferencias(db, current_user)
    return PreferenciasOut(
        idioma=pref.idioma,
        tema_visual=pref.tema_visual,
        zona_horaria=pref.configuracion_regional,
    )


@router.put("/perfil/preferencias", response_model=PreferenciasOut)
async def update_preferencias(
    data: PreferenciasUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Update current user's preferences."""
    pref = await svc.update_preferencias(db, current_user, data.model_dump(exclude_none=True))
    return PreferenciasOut(
        idioma=pref.idioma,
        tema_visual=pref.tema_visual,
        zona_horaria=pref.configuracion_regional,
    )
