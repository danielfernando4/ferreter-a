import re
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

from .models import Session, User
from .schemas import (
    ChangePasswordRequest,
    ChangePasswordResponse,
    CreateUserRequest,
    DeleteUserResponse,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    SessionCheckResponse,
    SessionExtendResponse,
    SetupRequest,
    SetupResponse,
    SetupStatusResponse,
    UpdateUserRequest,
    UserBrief,
    UserResponse,
)

router = APIRouter()

# --- Constants ---
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
SESSION_DURATION_MINUTES = 15
PASSWORD_REGEX = re.compile(r'^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$')


# --- Helpers ---
def _hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    import bcrypt as _bcrypt
    return _bcrypt.hashpw(password.encode('utf-8'), _bcrypt.gensalt(12)).decode('utf-8')


def _check_password(password: str, password_hash: str) -> bool:
    """Verify a password against a bcrypt hash."""
    import bcrypt as _bcrypt
    return _bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


def _validate_password_policy(password: str) -> None:
    """Validate password meets minimum security requirements."""
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 8 caracteres"
        )
    if not re.search(r'[A-Z]', password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe contener al menos una mayúscula"
        )
    if not re.search(r'\d', password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe contener al menos un número"
        )
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe contener al menos un carácter especial"
        )


async def _get_token_user(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the bearer token, returning the authenticated user."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autorizado"
        )
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autorizado"
        )
    token = authorization[7:]
    result = await db.execute(
        select(Session).where(Session.token == token)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autorizado"
        )
    if session.expires_at < datetime.utcnow():
        await db.delete(session)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión expirada"
        )
    user_result = await db.execute(
        select(User).where(User.id == session.user_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autorizado"
        )
    return user


async def _require_admin(user: User = Depends(_get_token_user)) -> User:
    """Ensure the authenticated user has admin role."""
    if user.role != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos de administrador"
        )
    return user


# ===== SETUP ENDPOINTS =====

@router.get('/setup/status', response_model=SetupStatusResponse)
async def check_setup_status(db: AsyncSession = Depends(get_db)):
    """Check if setup is required (no users exist)."""
    try:
        result = await db.execute(select(User))
        users = result.scalars().all()
        return SetupStatusResponse(setup_required=len(users) == 0)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post('/setup', response_model=SetupResponse, status_code=status.HTTP_201_CREATED)
async def setup_first_admin(request: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Create the first administrator user."""
    try:
        result = await db.execute(select(User))
        existing_users = result.scalars().all()
        if len(existing_users) > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un usuario en el sistema"
            )

        if not request.full_name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre completo es obligatorio"
            )
        if not request.username.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario es obligatorio"
            )
        if not request.email.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico es obligatorio"
            )
        if not request.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña es obligatoria"
            )

        _validate_password_policy(request.password)

        username_check = await db.execute(
            select(User).where(User.username == request.username.strip())
        )
        if username_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El nombre de usuario ya existe"
            )

        email_check = await db.execute(
            select(User).where(User.email == request.email.strip())
        )
        if email_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya existe"
            )

        password_hash = _hash_password(request.password)
        user = User(
            id=str(uuid.uuid4()),
            full_name=request.full_name.strip(),
            username=request.username.strip(),
            email=request.email.strip(),
            password_hash=password_hash,
            role="administrador",
            is_active=True,
            failed_attempts=0,
            locked_until=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(user)
        await db.commit()
        return SetupResponse(message="Administrador creado exitosamente")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ===== AUTH ENDPOINTS =====

@router.post('/auth/login', response_model=LoginResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user credentials and return a session token."""
    try:
        result = await db.execute(
            select(User).where(User.username == request.username)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Credenciales inválidas"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="La cuenta no está activa"
            )

        if user.locked_until and user.locked_until > datetime.utcnow():
            remaining = (user.locked_until - datetime.utcnow()).seconds // 60
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cuenta temporalmente bloqueada. Intente nuevamente en {remaining} minuto(s)"
            )

        if user.locked_until and user.locked_until <= datetime.utcnow():
            user.locked_until = None
            user.failed_attempts = 0

        if not _check_password(request.password, user.password_hash):
            user.failed_attempts += 1
            if user.failed_attempts >= MAX_FAILED_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Credenciales inválidas"
            )

        user.failed_attempts = 0
        user.locked_until = None

        token = str(uuid.uuid4())
        session = Session(
            id=str(uuid.uuid4()),
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(minutes=SESSION_DURATION_MINUTES),
            created_at=datetime.utcnow(),
        )
        db.add(session)
        user.updated_at = datetime.utcnow()
        await db.commit()

        return LoginResponse(
            token=token,
            user=UserBrief(
                id=user.id,
                full_name=user.full_name,
                username=user.username,
                email=user.email,
                role=user.role,
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post('/auth/logout', response_model=LogoutResponse)
async def logout(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Invalidate the current session token."""
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No autorizado"
            )
        token = authorization[7:]
        result = await db.execute(
            select(Session).where(Session.token == token)
        )
        session = result.scalar_one_or_none()
        if session:
            await db.delete(session)
            await db.commit()
        return LogoutResponse(message="Sesión cerrada")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get('/auth/me', response_model=UserResponse)
async def get_me(user: User = Depends(_get_token_user)):
    """Return the authenticated user's profile."""
    try:
        return UserResponse(
            id=user.id,
            full_name=user.full_name,
            username=user.username,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post('/auth/change-password', response_model=ChangePasswordResponse)
async def change_password(
    request: ChangePasswordRequest,
    user: User = Depends(_get_token_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the authenticated user's password."""
    try:
        if not _check_password(request.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Contraseña actual incorrecta"
            )

        _validate_password_policy(request.new_password)

        if request.new_password != request.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Las contraseñas nuevas no coinciden"
            )

        if request.new_password == request.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La nueva contraseña no puede ser igual a la actual"
            )

        new_hash = _hash_password(request.new_password)
        user.password_hash = new_hash
        user.updated_at = datetime.utcnow()

        result = await db.execute(
            select(Session).where(
                Session.user_id == user.id,
                Session.token != None  # noqa: E711
            )
        )
        sessions = result.scalars().all()
        current_token = None
        # Find the current session token from the authorization header
        # We'll invalidate all sessions except the current one
        for s in sessions:
            await db.delete(s)
        await db.commit()

        return ChangePasswordResponse(message="Contraseña actualizada")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get('/auth/session/check', response_model=SessionCheckResponse)
async def check_session(user: User = Depends(_get_token_user), db: AsyncSession = Depends(get_db)):
    """Check if the current session is still active."""
    try:
        # Get current session from the token
        result = await db.execute(
            select(Session).where(Session.user_id == user.id)
        )
        sessions = result.scalars().all()
        active_sessions = [s for s in sessions if s.expires_at > datetime.utcnow()]
        if not active_sessions:
            return SessionCheckResponse(active=False, expires_at="")
        active_sessions.sort(key=lambda s: s.expires_at, reverse=True)
        return SessionCheckResponse(
            active=True,
            expires_at=active_sessions[0].expires_at.isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post('/auth/session/extend', response_model=SessionExtendResponse)
async def extend_session(
    user: User = Depends(_get_token_user),
    db: AsyncSession = Depends(get_db),
):
    """Extend the current session by resetting the expiry time."""
    try:
        result = await db.execute(
            select(Session).where(Session.user_id == user.id)
        )
        sessions = result.scalars().all()
        active_sessions = [s for s in sessions if s.expires_at > datetime.utcnow()]
        if not active_sessions:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No hay sesión activa"
            )
        active_sessions.sort(key=lambda s: s.expires_at, reverse=True)
        session = active_sessions[0]
        session.expires_at = datetime.utcnow() + timedelta(minutes=SESSION_DURATION_MINUTES)
        await db.commit()
        return SessionExtendResponse(
            message="Sesión extendida",
            expires_at=session.expires_at.isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ===== ADMIN USER MANAGEMENT ENDPOINTS =====

@router.get('/admin/users', response_model=list[UserResponse])
async def list_users(admin: User = Depends(_require_admin), db: AsyncSession = Depends(get_db)):
    """List all registered users (admin only)."""
    try:
        result = await db.execute(select(User).order_by(User.created_at.desc()))
        users = result.scalars().all()
        return [
            UserResponse(
                id=u.id,
                full_name=u.full_name,
                username=u.username,
                email=u.email,
                role=u.role,
                is_active=u.is_active,
                created_at=u.created_at,
            )
            for u in users
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get('/admin/users/{user_id}', response_model=UserResponse)
async def get_user(
    user_id: str,
    admin: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a single user by ID (admin only)."""
    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        return UserResponse(
            id=user.id,
            full_name=user.full_name,
            username=user.username,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post('/admin/users', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: CreateUserRequest,
    admin: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user (admin only)."""
    try:
        _validate_password_policy(request.password)

        username_check = await db.execute(
            select(User).where(User.username == request.username.strip())
        )
        if username_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El nombre de usuario ya existe"
            )

        email_check = await db.execute(
            select(User).where(User.email == request.email.strip())
        )
        if email_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya existe"
            )

        password_hash = _hash_password(request.password)
        user = User(
            id=str(uuid.uuid4()),
            full_name=request.full_name.strip(),
            username=request.username.strip(),
            email=request.email.strip(),
            password_hash=password_hash,
            role=request.role,
            is_active=True,
            failed_attempts=0,
            locked_until=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        return UserResponse(
            id=user.id,
            full_name=user.full_name,
            username=user.username,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put('/admin/users/{user_id}', response_model=UserResponse)
async def update_user(
    user_id: str,
    request: UpdateUserRequest,
    admin: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing user (admin only). Username is not editable."""
    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        email_check = await db.execute(
            select(User).where(
                User.email == request.email.strip(),
                User.id != user_id
            )
        )
        if email_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está en uso por otro usuario"
            )

        user.full_name = request.full_name.strip()
        user.email = request.email.strip()
        user.role = request.role
        user.is_active = request.is_active
        user.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(user)

        return UserResponse(
            id=user.id,
            full_name=user.full_name,
            username=user.username,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete('/admin/users/{user_id}', response_model=DeleteUserResponse)
async def delete_user(
    user_id: str,
    admin: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user. Cannot delete yourself."""
    try:
        if user_id == admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puede eliminar su propio usuario"
            )

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        await db.delete(user)
        await db.commit()
        return DeleteUserResponse(message="Usuario eliminado")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
