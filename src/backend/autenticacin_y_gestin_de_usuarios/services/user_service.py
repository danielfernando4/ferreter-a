from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from autenticacin_y_gestin_de_usuarios.models import Usuario
from autenticacin_y_gestin_de_usuarios.utils.security import (
    hash_password,
    generate_uuid,
    validate_password_policy,
)


async def list_users(db: AsyncSession) -> list[Usuario]:
    result = await db.execute(select(Usuario).order_by(Usuario.created_at))
    return list(result.scalars().all())


async def get_user_by_id(db: AsyncSession, user_id: str) -> Usuario | None:
    result = await db.execute(select(Usuario).where(Usuario.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> Usuario | None:
    result = await db.execute(select(Usuario).where(Usuario.username == username))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> Usuario | None:
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    full_name: str,
    username: str,
    email: str,
    password: str,
    role: str,
) -> tuple[Usuario | None, str]:
    """Returns (user, error_message)."""
    # Validate password policy
    is_valid, error = validate_password_policy(password)
    if not is_valid:
        return None, error

    # Check username uniqueness
    existing = await get_user_by_username(db, username)
    if existing is not None:
        return None, "El nombre de usuario ya existe"

    # Check email uniqueness
    existing = await get_user_by_email(db, email)
    if existing is not None:
        return None, "El correo electrónico ya existe"

    user = Usuario(
        id=generate_uuid(),
        full_name=full_name,
        username=username,
        email=email,
        password_hash=hash_password(password),
        role=role,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user, ""


async def update_user(
    db: AsyncSession,
    user: Usuario,
    full_name: str,
    email: str,
    role: str,
    is_active: bool,
) -> tuple[Usuario | None, str]:
    """Returns (updated_user, error_message)."""
    # Check email uniqueness (excluding current user)
    existing = await get_user_by_email(db, email)
    if existing is not None and existing.id != user.id:
        return None, "El correo electrónico ya está en uso por otro usuario"

    user.full_name = full_name
    user.email = email
    user.role = role
    user.is_active = is_active
    await db.commit()
    await db.refresh(user)
    return user, ""


async def delete_user(db: AsyncSession, user: Usuario) -> None:
    await db.delete(user)
    await db.commit()
