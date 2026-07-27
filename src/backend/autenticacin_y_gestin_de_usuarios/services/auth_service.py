from datetime import datetime, timezone

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from autenticacin_y_gestin_de_usuarios.models import Usuario, Sesion
from autenticacin_y_gestin_de_usuarios.utils.security import (
    hash_password,
    check_password,
    validate_password_policy,
    generate_token,
    get_lockout_time,
    get_session_expiry,
    generate_uuid,
    MAX_FAILED_ATTEMPTS,
)


async def authenticate_user(db: AsyncSession, username: str, password: str) -> tuple[Usuario | None, str | None]:
    """Returns (user, error_message). If successful, error_message is None."""
    result = await db.execute(select(Usuario).where(Usuario.username == username))
    user = result.scalar_one_or_none()

    if user is None:
        return None, "Credenciales inválidas"

    # Check if account is locked
    now = datetime.now(timezone.utc)
    if user.locked_until is not None:
        if now < user.locked_until:
            remaining = int((user.locked_until - now).total_seconds() / 60)
            return None, f"Cuenta temporalmente bloqueada. Intente nuevamente en {remaining} minuto(s)."
        else:
            # Lock expired, reset
            user.locked_until = None
            user.failed_attempts = 0
            await db.commit()

    # Check if account is active
    if not user.is_active:
        return None, "La cuenta no está activa. Contacte al administrador."

    # Verify password
    if not check_password(password, user.password_hash):
        user.failed_attempts += 1
        if user.failed_attempts >= MAX_FAILED_ATTEMPTS:
            user.locked_until = get_lockout_time()
        await db.commit()
        return None, "Credenciales inválidas"

    # Successful login
    user.failed_attempts = 0
    user.locked_until = None
    await db.commit()

    return user, None


async def create_session(db: AsyncSession, user: Usuario) -> Sesion:
    token = generate_token()
    session = Sesion(
        id=generate_uuid(),
        user_id=user.id,
        token=token,
        expires_at=get_session_expiry(),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_user_by_token(db: AsyncSession, token: str) -> Usuario | None:
    result = await db.execute(
        select(Sesion).where(Sesion.token == token).where(Sesion.expires_at > datetime.now(timezone.utc))
    )
    session = result.scalar_one_or_none()
    if session is None:
        return None
    result = await db.execute(select(Usuario).where(Usuario.id == session.user_id))
    return result.scalar_one_or_none()


async def invalidate_session(db: AsyncSession, token: str) -> None:
    await db.execute(delete(Sesion).where(Sesion.token == token))
    await db.commit()


async def invalidate_user_sessions_except(db: AsyncSession, user_id: str, except_token: str) -> None:
    await db.execute(
        delete(Sesion).where(Sesion.user_id == user_id).where(Sesion.token != except_token)
    )
    await db.commit()


async def extend_session(db: AsyncSession, token: str) -> Sesion | None:
    result = await db.execute(
        select(Sesion).where(Sesion.token == token).where(Sesion.expires_at > datetime.now(timezone.utc))
    )
    session = result.scalar_one_or_none()
    if session is None:
        return None
    session.expires_at = get_session_expiry()
    await db.commit()
    await db.refresh(session)
    return session


async def change_user_password(
    db: AsyncSession,
    user: Usuario,
    current_password: str,
    new_password: str,
    confirm_password: str,
    current_token: str,
) -> tuple[bool, str]:
    """Returns (success, error_message)."""
    # Verify current password
    if not check_password(current_password, user.password_hash):
        return False, "La contraseña actual es incorrecta"

    # Check new password is different from current
    if current_password == new_password:
        return False, "La nueva contraseña debe ser diferente a la actual"

    # Check confirmation matches
    if new_password != confirm_password:
        return False, "Las contraseñas nuevas no coinciden"

    # Validate password policy
    is_valid, error = validate_password_policy(new_password)
    if not is_valid:
        return False, error

    # Hash and update
    user.password_hash = hash_password(new_password)
    await db.commit()

    # Invalidate all other sessions
    await invalidate_user_sessions_except(db, user.id, current_token)

    return True, ""


async def check_setup_required(db: AsyncSession) -> bool:
    result = await db.execute(select(Usuario).limit(1))
    user = result.scalar_one_or_none()
    return user is None


async def create_first_admin(db: AsyncSession, full_name: str, username: str, email: str, password: str) -> tuple[bool, str]:
    """Returns (success, error_message)."""
    # Check if any user exists
    result = await db.execute(select(Usuario).limit(1))
    existing = result.scalar_one_or_none()
    if existing is not None:
        return False, "Ya existe un usuario en el sistema"

    # Validate password
    is_valid, error = validate_password_policy(password)
    if not is_valid:
        return False, error

    # Check username uniqueness
    result = await db.execute(select(Usuario).where(Usuario.username == username))
    if result.scalar_one_or_none() is not None:
        return False, "El nombre de usuario ya existe"

    # Check email uniqueness
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    if result.scalar_one_or_none() is not None:
        return False, "El correo electrónico ya existe"

    user = Usuario(
        id=generate_uuid(),
        full_name=full_name,
        username=username,
        email=email,
        password_hash=hash_password(password),
        role="administrador",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    return True, ""
