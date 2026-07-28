from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from autenticacin_usuarios_y_configuracin_inicial.models import TokenSesion, Usuario
from autenticacin_usuarios_y_configuracin_inicial.utils import hash_token
from database import get_db

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    token_str = credentials.credentials
    token_hashed = hash_token(token_str)

    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.token_hash == token_hashed,
            TokenSesion.activo.is_(True),
            TokenSesion.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    token_row = result.scalar_one_or_none()

    if token_row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )

    user_result = await db.execute(
        select(Usuario).where(Usuario.id == token_row.usuario_id)
    )
    user = user_result.scalar_one_or_none()

    if user is None or not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo",
        )

    return user


async def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.rol.nombre != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requiere rol de administrador.",
        )
    return current_user
