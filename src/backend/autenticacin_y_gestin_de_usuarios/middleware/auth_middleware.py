from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from autenticacin_y_gestin_de_usuarios.models import Usuario
from autenticacin_y_gestin_de_usuarios.services.auth_service import get_user_by_token

security = HTTPBearer(auto_error=False)

ALLOWED_ROLES = {
    "administrador": {"usuarios", "inventario", "ventas", "compras", "reportes", "clientes", "proveedores"},
    "bodega": {"inventario", "compras"},
    "vendedor": {"ventas", "clientes", "inventario"},
    "compras": {"compras", "proveedores"},
}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autorizado")
    user = await get_user_by_token(db, credentials.credentials)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autorizado")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta inactiva")
    return user


def require_role(required_role: str):
    async def role_checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if required_role == "admin" and current_user.role != "administrador":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado: se requiere rol de administrador")
        return current_user
    return role_checker


def get_token_from_credentials(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> str:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autorizado")
    return credentials.credentials
