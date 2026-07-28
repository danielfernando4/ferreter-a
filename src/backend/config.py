import secrets
from datetime import timedelta


class Settings:
    SECRET_KEY: str = secrets.token_hex(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REMEMBER_TOKEN_EXPIRE_DAYS: int = 30
    RESET_TOKEN_EXPIRE_HOURS: int = 1
    ROLES: list[str] = ["administrador", "vendedor", "almacen"]
    ROLES_MAP: dict[str, str] = {
        "administrador": "Administrador",
        "vendedor": "Vendedor / Cajero",
        "almacen": "Almacén / Comprador",
    }


settings = Settings()
