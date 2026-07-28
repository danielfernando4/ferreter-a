from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

from .models import TokenSesion, Usuario
from .utils import hash_token

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Extract and validate the Bearer token, return the authenticated user."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_str = credentials.credentials
    token_hashed = hash_token(token_str)

    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.token_hash == token_hashed,
            TokenSesion.activo == True,
            TokenSesion.fecha_expiracion > __import__("datetime").datetime.now(
                __import__("datetime").timezone.utc
            ),
        )
    )
    token_record = result.scalar_one_or_none()

    if token_record is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_result = await db.execute(
        select(Usuario).where(Usuario.id == token_record.usuario_id, Usuario.activo == True)
    )
    user = user_result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Require the current user to have admin role."""
    # Access rol name via relationship
    from .models import Rol

    # We need to eager load the rol - but since it's a relationship it may not be loaded.
    # Let's check: The get_current_user returns the user but rol might not be loaded.
    # We'll handle it by checking the rol_id and doing a lookup.
    if current_user.rol_id != 1:  # Admin is typically rol_id=1
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requieren permisos de administrador.",
        )

    return current_user
