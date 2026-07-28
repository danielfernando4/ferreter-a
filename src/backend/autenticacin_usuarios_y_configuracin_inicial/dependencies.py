from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from autenticacin_usuarios_y_configuracin_inicial.models import Usuario
from autenticacin_usuarios_y_configuracin_inicial.service import get_user_by_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Dependency to get the currently authenticated user from the Bearer token."""
    token = credentials.credentials
    user = await get_user_by_token(db, token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido, expirado o sesión cerrada.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario desactivado. Contacte al administrador.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def require_admin(user: Usuario = Depends(get_current_user)) -> Usuario:
    """Dependency to require admin role."""
    if user.rol.nombre != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requiere rol de administrador.",
        )
    return user
