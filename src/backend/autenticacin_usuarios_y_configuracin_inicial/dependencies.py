from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from autenticacin_usuarios_y_configuracin_inicial.models import Usuario
from autenticacin_usuarios_y_configuracin_inicial.service import get_user_from_token
from config import settings
from database import get_db

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Dependency that extracts and validates the current user from the Bearer token."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    usuario = await get_user_from_token(db, token)

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return usuario


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[Usuario]:
    """Optional auth dependency — returns None if no token is provided."""
    if credentials is None:
        return None

    token = credentials.credentials
    usuario = await get_user_from_token(db, token)
    return usuario


def require_role(allowed_roles: list[str]):
    """Dependency factory that checks if the current user has one of the allowed roles."""

    async def role_checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if current_user.rol.nombre not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para acceder a este recurso",
            )
        return current_user

    return role_checker


# Pre-built role dependencies
require_admin = require_role(["administrador"])
require_vendedor = require_role(["administrador", "vendedor"])
require_almacen = require_role(["administrador", "almacen"])
require_admin_or_vendedor = require_role(["administrador", "vendedor"])
require_admin_or_almacen = require_role(["administrador", "almacen"])
