from typing import Optional, List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from autenticacin_usuarios_y_configuracin_inicial.models import Usuario, Rol
from autenticacin_usuarios_y_configuracin_inicial.service import get_current_user_from_token

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Dependency to extract and validate the current user from Bearer token."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="UNAUTHORIZED",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    user = await get_current_user_from_token(db, token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="UNAUTHORIZED",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Dependency to ensure the current user has admin role."""
    # Ensure rol is loaded
    if current_user.rol is None or not hasattr(current_user.rol, "nombre"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="FORBIDDEN",
        )

    if current_user.rol.nombre != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="FORBIDDEN",
        )

    return current_user


ROLES_ADMIN_ONLY = ["administrador"]
