from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

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
    change_password,
    check_setup_status,
    create_usuario,
    deactivate_usuario,
    forgot_password,
    get_user_preferences,
    get_usuario_by_id,
    list_usuarios,
    logout_user,
    reactivate_usuario,
    reset_password,
    run_setup,
    update_user_preferences,
    update_usuario,
    verify_reset_token,
)

router = APIRouter()


# ─── Endpoints Públicos (Sin autenticación) ──────────────────────────────────

@router.get('/auth/check-setup', response_model=SetupStatusResponse, tags=['Setup'])
async def check_setup(db: AsyncSession = Depends(get_db)):
    try:
        result = await check_setup_status(db)
        return SetupStatusResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post('/auth/setup', response_model=SetupResponse, tags=['Setup'])
async def run_setup_endpoint(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await run_setup(db, data)
        return SetupResponse(
            mensaje=result['mensaje'],
            usuario=UserOut.model_validate(result['usuario']),
        )
    except ValueError as e:
        error_msg = str(e)
        if error_msg == 'SETUP_ALREADY_COMPLETED':
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='La configuración inicial ya fue completada.',
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )


@router.post('/auth/login', response_model=LoginResponse, tags=['Auth'])
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await authenticate_user(db, data.email, data.password, data.remember)
        return LoginResponse(
            token=result['token'],
            token_type='bearer',
            expires_in=result['expires_in'],
            usuario=UserOut.model_validate(result['usuario']),
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Credenciales inválidas',
        )


@router.post('/auth/forgot-password', response_model=ForgotPasswordResponse, tags=['Auth'])
async def forgot_password_endpoint(
    data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
):
    result = await forgot_password(db, data.email)
    return ForgotPasswordResponse(mensaje=result['mensaje'])


@router.get('/auth/verify-reset-token/{token}', response_model=VerifyTokenResponse, tags=['Auth'])
async def verify_reset_token_endpoint(token: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await verify_reset_token(db, token)
        return VerifyTokenResponse(**result)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == 'TOKEN_EXPIRED':
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail='El token de restablecimiento ha expirado.',
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Token de restablecimiento no encontrado.',
        )


@router.post('/auth/reset-password', response_model=ResetPasswordResponse, tags=['Auth'])
async def reset_password_endpoint(
    data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
):
    try:
        result = await reset_password(db, data.token, data.new_password, data.confirm_password)
        return ResetPasswordResponse(mensaje=result['mensaje'])
    except ValueError as e:
        error_msg = str(e)
        if error_msg == 'PASSWORDS_DONT_MATCH':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Las contraseñas no coinciden.',
            )
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail='El token es inválido o ha expirado.',
        )


# ─── Endpoints Protegidos: Auth ──────────────────────────────────────────────

@router.get('/auth/me', response_model=UserOut, tags=['Auth'])
async def get_me(current_user: Usuario = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.post('/auth/logout', response_model=LogoutResponse, tags=['Auth'])
async def logout(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from autenticacin_usuarios_y_configuracin_inicial.service import invalidate_all_user_sessions
    await invalidate_all_user_sessions(db, current_user.id)
    return LogoutResponse(mensaje='Sesión cerrada exitosamente.')


# ─── Endpoints Protegidos: Gestión de Usuarios (Admin) ───────────────────────

@router.get('/usuarios', response_model=PaginatedUsersResponse, tags=['Admin'])
async def list_usuarios_endpoint(
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    try:
        result = await list_usuarios(db, search, page, page_size)
        return PaginatedUsersResponse(
            items=[UserOut.model_validate(u) for u in result['items']],
            total=result['total'],
            page=result['page'],
            page_size=result['page_size'],
            total_pages=result['total_pages'],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get('/usuarios/{usuario_id}', response_model=UserOut, tags=['Admin'])
async def get_usuario_endpoint(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    usuario = await get_usuario_by_id(db, usuario_id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Usuario no encontrado.',
        )
    return UserOut.model_validate(usuario)


@router.post('/usuarios', response_model=UserOut, tags=['Admin'])
async def create_usuario_endpoint(
    data: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    try:
        usuario = await create_usuario(db, data)
        return UserOut.model_validate(usuario)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == 'EMAIL_EXISTS':
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='El correo electrónico ya está registrado.',
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )


@router.put('/usuarios/{usuario_id}', response_model=UserOut, tags=['Admin'])
async def update_usuario_endpoint(
    usuario_id: int,
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    try:
        usuario = await update_usuario(db, usuario_id, data)
        return UserOut.model_validate(usuario)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == 'NOT_FOUND':
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Usuario no encontrado.',
            )
        if error_msg == 'EMAIL_EXISTS':
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='El correo electrónico ya está registrado.',
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )


@router.patch('/usuarios/{usuario_id}/deactivate', response_model=UserActionResponse, tags=['Admin'])
async def deactivate_usuario_endpoint(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    try:
        usuario = await deactivate_usuario(db, usuario_id, current_user.id)
        return UserActionResponse(
            mensaje='Usuario desactivado exitosamente.',
            usuario=UserOut.model_validate(usuario),
        )
    except ValueError as e:
        error_msg = str(e)
        if error_msg == 'NOT_FOUND':
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Usuario no encontrado.',
            )
        if error_msg == 'CANNOT_DEACTIVATE_SELF':
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='No puedes desactivar tu propia cuenta.',
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )


@router.patch('/usuarios/{usuario_id}/reactivate', response_model=UserActionResponse, tags=['Admin'])
async def reactivate_usuario_endpoint(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    try:
        usuario = await reactivate_usuario(db, usuario_id)
        return UserActionResponse(
            mensaje='Usuario reactivado exitosamente.',
            usuario=UserOut.model_validate(usuario),
        )
    except ValueError as e:
        error_msg = str(e)
        if error_msg == 'NOT_FOUND':
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Usuario no encontrado.',
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )


# ─── Endpoints Protegidos: Perfil y Preferencias ──────────────────────────────

@router.get('/perfil', response_model=PerfilResponse, tags=['Profile'])
async def get_perfil(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    prefs = await get_user_preferences(db, current_user)
    return PerfilResponse(
        usuario=UserOut.model_validate(current_user),
        preferencias=PreferenciasOut.model_validate(prefs),
    )


@router.put('/perfil', response_model=UserOut, tags=['Profile'])
async def update_perfil(
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        usuario = await update_usuario(db, current_user.id, data)
        return UserOut.model_validate(usuario)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == 'EMAIL_EXISTS':
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='El correo electrónico ya está registrado.',
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )


@router.put('/perfil/cambiar-password', response_model=ChangePasswordResponse, tags=['Profile'])
async def cambiar_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        result = await change_password(
            db, current_user, data.current_password, data.new_password, data.confirm_password
        )
        return ChangePasswordResponse(mensaje=result['mensaje'])
    except ValueError as e:
        error_msg = str(e)
        if error_msg == 'INVALID_CURRENT_PASSWORD':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='La contraseña actual es incorrecta.',
            )
        if error_msg == 'PASSWORDS_DONT_MATCH':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Las contraseñas nuevas no coinciden.',
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )


@router.get('/perfil/preferencias', response_model=PreferenciasOut, tags=['Profile'])
async def get_preferencias(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    prefs = await get_user_preferences(db, current_user)
    return PreferenciasOut.model_validate(prefs)


@router.put('/perfil/preferencias', response_model=PreferenciasOut, tags=['Profile'])
async def update_preferencias(
    data: PreferenciasUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        prefs = await update_user_preferences(db, current_user, data)
        return PreferenciasOut.model_validate(prefs)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
