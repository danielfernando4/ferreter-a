from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from autenticacin_y_gestin_de_usuarios.schemas import (
    SetupRequest,
    SetupResponse,
    SetupStatusResponse,
    LoginRequest,
    LoginResponse,
    UserMeResponse,
    ChangePasswordRequest,
    SessionCheckResponse,
    SessionExtendResponse,
    CreateUserRequest,
    UpdateUserRequest,
    UserResponse,
    MessageResponse,
)
from autenticacin_y_gestin_de_usuarios.services.auth_service import (
    authenticate_user,
    create_session,
    get_user_by_token,
    invalidate_session,
    extend_session,
    change_user_password,
    check_setup_required,
    create_first_admin,
)
from autenticacin_y_gestin_de_usuarios.services.user_service import (
    list_users,
    get_user_by_id,
    create_user,
    update_user,
    delete_user,
)
from autenticacin_y_gestin_de_usuarios.middleware.auth_middleware import (
    get_current_user,
    require_role,
    get_token_from_credentials,
)
from autenticacin_y_gestin_de_usuarios.models import Usuario

router = APIRouter()


# ─── Setup endpoints ───
@router.get('/setup/status', response_model=SetupStatusResponse, tags=['Setup'])
async def check_setup_status(db: AsyncSession = Depends(get_db)):
    try:
        setup_required = await check_setup_required(db)
        return SetupStatusResponse(setup_required=setup_required)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post('/setup', response_model=SetupResponse, status_code=status.HTTP_201_CREATED, tags=['Setup'])
async def setup_first_admin(body: SetupRequest, db: AsyncSession = Depends(get_db)):
    try:
        # Validate required fields
        if not body.full_name or not body.username or not body.email or not body.password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Todos los campos son obligatorios")
        success, error = await create_first_admin(db, body.full_name, body.username, body.email, body.password)
        if not success:
            if "ya existe" in error:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=error)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
        return SetupResponse(message="Administrador creado exitosamente")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ─── Auth endpoints ───
@router.post('/auth/login', response_model=LoginResponse, tags=['Auth'])
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        user, error = await authenticate_user(db, body.username, body.password)
        if user is None:
            if "bloqueada" in error:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
            if "inactiva" in error:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
        session = await create_session(db, user)
        return LoginResponse(
            token=session.token,
            user=UserMeResponse.model_validate(user),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post('/auth/logout', response_model=MessageResponse, tags=['Auth'])
async def logout(token: str = Depends(get_token_from_credentials), db: AsyncSession = Depends(get_db)):
    try:
        await invalidate_session(db, token)
        return MessageResponse(message="Sesión cerrada")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get('/auth/me', response_model=UserMeResponse, tags=['Auth'])
async def get_me(current_user: Usuario = Depends(get_current_user)):
    try:
        return UserMeResponse.model_validate(current_user)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post('/auth/change-password', response_model=MessageResponse, tags=['Auth'])
async def change_password(
    body: ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user),
    token: str = Depends(get_token_from_credentials),
    db: AsyncSession = Depends(get_db),
):
    try:
        success, error = await change_user_password(
            db, current_user, body.current_password, body.new_password, body.confirm_password, token
        )
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
        return MessageResponse(message="Contraseña actualizada")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get('/auth/session/check', response_model=SessionCheckResponse, tags=['Auth'])
async def check_session(
    current_user: Usuario = Depends(get_current_user),
    token: str = Depends(get_token_from_credentials),
    db: AsyncSession = Depends(get_db),
):
    try:
        from sqlalchemy import select
        from autenticacin_y_gestin_de_usuarios.models import Sesion
        from datetime import datetime, timezone

        result = await db.execute(
            select(Sesion).where(Sesion.token == token).where(Sesion.expires_at > datetime.now(timezone.utc))
        )
        session = result.scalar_one_or_none()
        if session is None:
            return SessionCheckResponse(active=False)
        return SessionCheckResponse(active=True, expires_at=session.expires_at)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post('/auth/session/extend', response_model=SessionExtendResponse, tags=['Auth'])
async def extend_session_endpoint(
    token: str = Depends(get_token_from_credentials),
    db: AsyncSession = Depends(get_db),
):
    try:
        session = await extend_session(db, token)
        if session is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autorizado")
        return SessionExtendResponse(message="Sesión extendida", expires_at=session.expires_at)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ─── Admin Users endpoints ───
@router.get('/admin/users', response_model=list[UserResponse], tags=['Admin'])
async def list_users_endpoint(
    current_user: Usuario = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    try:
        users = await list_users(db)
        return [UserResponse.model_validate(u) for u in users]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get('/admin/users/{user_id}', response_model=UserResponse, tags=['Admin'])
async def get_user_endpoint(
    user_id: str,
    current_user: Usuario = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await get_user_by_id(db, user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        return UserResponse.model_validate(user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post('/admin/users', response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=['Admin'])
async def create_user_endpoint(
    body: CreateUserRequest,
    current_user: Usuario = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    try:
        user, error = await create_user(db, body.full_name, body.username, body.email, body.password, body.role)
        if user is None:
            if "ya existe" in error:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=error)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
        return UserResponse.model_validate(user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put('/admin/users/{user_id}', response_model=UserResponse, tags=['Admin'])
async def update_user_endpoint(
    user_id: str,
    body: UpdateUserRequest,
    current_user: Usuario = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await get_user_by_id(db, user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        updated_user, error = await update_user(db, user, body.full_name, body.email, body.role, body.is_active)
        if updated_user is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
        return UserResponse.model_validate(updated_user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete('/admin/users/{user_id}', response_model=MessageResponse, tags=['Admin'])
async def delete_user_endpoint(
    user_id: str,
    current_user: Usuario = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    try:
        if current_user.id == user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puede eliminar su propia cuenta")
        user = await get_user_by_id(db, user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        await delete_user(db, user)
        return MessageResponse(message="Usuario eliminado")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
