from typing import List, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

from . import models as mdl
from .service import obtener_usuario_por_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> mdl.Usuario:
    """Dependencia que obtiene el usuario autenticado a partir del token Bearer."""
    token = credentials.credentials
    usuario = await obtener_usuario_por_token(db, token)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido, expirado o sesión cerrada",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario desactivado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return usuario


class RoleChecker:
    """Dependencia que verifica que el usuario tenga un rol permitido."""

    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    async def __call__(
        self,
        current_user: mdl.Usuario = Depends(get_current_user),
    ) -> mdl.Usuario:
        if current_user.rol.nombre not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para acceder a este recurso",
            )
        return current_user


# Predefinir checkeadores de rol
require_admin = RoleChecker(["administrador"])
require_admin_or_vendedor = RoleChecker(["administrador", "vendedor"])
require_admin_or_almacen = RoleChecker(["administrador", "almacen"])
