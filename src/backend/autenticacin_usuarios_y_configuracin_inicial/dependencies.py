from typing import Tuple

from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from autenticacin_usuarios_y_configuracin_inicial.models import Usuario, TokenSesion
from autenticacin_usuarios_y_configuracin_inicial.utils import hash_token

security = HTTPBearer(auto_error=False)

ROLES_ADMIN = {"administrador"}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Validate Bearer token and return the authenticated user.

    Raises 401 if token is missing, invalid, expired, or user is inactive.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere autenticación",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_str = credentials.credentials
    token_hashed = hash_token(token_str)

    result = await db.execute(
        select(TokenSesion)
        .options(selectinload(TokenSesion.usuario).selectinload(Usuario.rol))
        .where(TokenSesion.token_hash == token_hashed, TokenSesion.activo == True)
    )
    token_record = result.scalar_one_or_none()

    if token_record is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o sesión expirada",
            headers={"WWW-Authenticate": "Bearer"},
        )

    now = datetime.now(timezone.utc)
    if token_record.fecha_expiracion.replace(tzinfo=timezone.utc) < now:
        token_record.activo = False
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = token_record.usuario
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_user_and_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Tuple[Usuario, TokenSesion]:
    """Validate Bearer token and return both user and token record."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere autenticación",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_str = credentials.credentials
    token_hashed = hash_token(token_str)

    result = await db.execute(
        select(TokenSesion)
        .options(selectinload(TokenSesion.usuario).selectinload(Usuario.rol))
        .where(TokenSesion.token_hash == token_hashed, TokenSesion.activo == True)
    )
    token_record = result.scalar_one_or_none()

    if token_record is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o sesión expirada",
            headers={"WWW-Authenticate": "Bearer"},
        )

    now = datetime.now(timezone.utc)
    if token_record.fecha_expiracion.replace(tzinfo=timezone.utc) < now:
        token_record.activo = False
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = token_record.usuario
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user, token_record


async def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Require the current user to have an admin role.

    Raises 403 if user is not an administrator.
    """
    rol_nombre = current_user.rol.nombre if hasattr(current_user.rol, "nombre") else str(current_user.rol)
    if rol_nombre not in ROLES_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requieren permisos de administrador",
        )
    return current_user
