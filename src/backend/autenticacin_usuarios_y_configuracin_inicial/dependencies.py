from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db

from .models import TokenSesion, Usuario
from .utils import decode_jwt_token, hash_token

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Dependency that extracts and validates the bearer token, returning the authenticated user."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Decode JWT to get user_id
    payload = decode_jwt_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify token exists in DB (not invalidated)
    token_hashed = hash_token(token)
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.token_hash == token_hashed,
            TokenSesion.activo == True,
        )
    )
    db_token = result.scalar_one_or_none()
    if db_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión inválida o token ha sido invalidado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user with eager-loaded relationships
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario desactivado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Dependency that ensures the current user has admin role."""
    if current_user.rol.nombre != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador para acceder a este recurso",
        )
    return current_user
