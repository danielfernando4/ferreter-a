from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db

from .models import TokenSesion, Usuario
from .utils import hash_token

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Extract and validate Bearer token, return current user."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="UNAUTHORIZED",
        )

    token_raw = credentials.credentials
    token_hashed = hash_token(token_raw)

    result = await db.execute(
        select(TokenSesion)
        .options(selectinload(TokenSesion.usuario).selectinload(Usuario.rol))
        .where(TokenSesion.token_hash == token_hashed, TokenSesion.activo == True)
    )
    token_record = result.scalars().first()

    if token_record is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="UNAUTHORIZED",
        )

    if token_record.fecha_expiracion.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        token_record.activo = False
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="UNAUTHORIZED",
        )

    user = token_record.usuario
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="UNAUTHORIZED",
        )

    return user


async def get_admin_user(
    current_user: Usuario = Depends(get_current_user),
) -> Usuario:
    """Require the current user to have admin role."""
    if current_user.rol.nombre != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="FORBIDDEN",
        )
    return current_user
