from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from .models import Usuario, TokenSesion
from .utils import compute_token_hash

security_scheme = HTTPBearer(auto_error=False)

PUBLIC_PATHS = {
    "/api/auth/check-setup",
    "/api/auth/setup",
    "/api/auth/login",
    "/api/auth/forgot-password",
    "/api/auth/verify-reset-token",
    "/api/auth/reset-password",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/health",
}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """
    Authenticate user from Bearer token.
    Returns the Usuario object with loaded role relationship.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    token_hash = compute_token_hash(token)

    # Find active session with this token hash
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.token_hash == token_hash,
            TokenSesion.activo == True,
            TokenSesion.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    session = result.scalar_one_or_none()

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Load user with role
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == session.usuario_id, Usuario.activo == True)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def require_admin(user: Usuario = Depends(get_current_user)) -> Usuario:
    """Require admin role."""
    rol_name = user.rol.nombre if hasattr(user.rol, "nombre") else str(user.rol)
    if rol_name != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador",
        )
    return user
