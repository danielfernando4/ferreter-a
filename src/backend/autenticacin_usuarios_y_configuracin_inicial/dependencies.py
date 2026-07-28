"""Authentication and authorization dependencies."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from .models import Usuario, TokenSesion
from .utils import hash_token

security = HTTPBearer(auto_error=False)

# Roles permitidos definidos en el sistema
ROLES = {
    "administrador": "Administrador con acceso completo",
    "vendedor": "Vendedor / Cajero - acceso a POS",
    "almacen": "Almacén / Comprador - acceso a inventario y compras",
}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Extract and validate the current user from the Bearer token."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"codigo": "UNAUTHORIZED", "mensaje": "Token de autenticación requerido"},
        )

    token = credentials.credentials
    token_hash = hash_token(token)

    # Find active token
    now = datetime.utcnow()
    result = await db.execute(
        select(TokenSesion)
        .options(selectinload(TokenSesion.usuario).selectinload(Usuario.rol))
        .where(
            TokenSesion.token_hash == token_hash,
            TokenSesion.activo == True,
            TokenSesion.fecha_expiracion > now,
        )
    )
    token_record = result.scalar_one_or_none()

    if token_record is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"codigo": "UNAUTHORIZED", "mensaje": "Token inválido o expirado"},
        )

    user = token_record.usuario
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"codigo": "UNAUTHORIZED", "mensaje": "Usuario inactivo"},
        )

    return user


async def require_admin(
    current_user: Usuario = Depends(get_current_user),
) -> Usuario:
    """Require the current user to have admin role."""
    if not hasattr(current_user, "rol") or current_user.rol is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"codigo": "FORBIDDEN", "mensaje": "Se requieren permisos de administrador"},
        )

    rol_name = current_user.rol.nombre if hasattr(current_user.rol, "nombre") else str(current_user.rol)
    if rol_name != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"codigo": "FORBIDDEN", "mensaje": "Se requieren permisos de administrador"},
        )

    return current_user
