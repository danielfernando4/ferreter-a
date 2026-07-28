from typing import Optional

from fastapi import Depends, HTTPException, status, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from autenticacin_usuarios_y_configuracin_inicial.models import Usuario, TokenSesion
from autenticacin_usuarios_y_configuracin_inicial.utils import hash_token


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Extract and validate Bearer token, return current user."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato de token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    token_hashed = hash_token(token)

    result = await db.execute(
        select(TokenSesion)
        .options(selectinload(TokenSesion.usuario).options(selectinload(Usuario.rol)))
        .where(
            TokenSesion.token_hash == token_hashed,
            TokenSesion.activo == True,
            TokenSesion.fecha_expiracion > __import__("datetime").datetime.now(__import__("datetime").timezone.utc),
        )
    )
    token_record = result.scalars().first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = token_record.usuario
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cuenta de usuario desactivada",
        )

    return user


async def require_admin(
    current_user: Usuario = Depends(get_current_user),
) -> Usuario:
    """Verify the current user has admin role."""
    if not current_user.rol or current_user.rol.nombre != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de administrador para acceder a este recurso",
        )
    return current_user
