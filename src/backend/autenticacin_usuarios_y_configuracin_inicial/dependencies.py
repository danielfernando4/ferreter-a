from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db

from .models import TokenSesion, Usuario
from .utils import decode_access_token, hash_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Extract and validate the current user from the Bearer token.

    Validates the JWT, checks the session token exists and is active,
    and returns the user with role loaded.
    """
    token = credentials.credentials

    # Decode JWT
    try:
        payload = decode_access_token(token)
        usuario_id_str = payload.get("sub")
        if usuario_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: no contiene identificador de usuario",
            )
        usuario_id = int(usuario_id_str)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )

    # Verify session token exists in DB
    token_hash = hash_token(token)
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.token_hash == token_hash,
            TokenSesion.activo == True,
        )
    )
    db_token = result.scalar_one_or_none()
    if db_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión no válida o token ha sido invalidado",
        )

    # Load user with relationships
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == usuario_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cuenta de usuario desactivada",
        )

    return user


async def require_admin(user: Usuario = Depends(get_current_user)) -> Usuario:
    """Verify the current user has the 'administrador' role."""
    if user.rol.nombre != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de administrador para esta operación",
        )
    return user
