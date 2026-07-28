import os
from datetime import timedelta


class Settings:
    APP_NAME: str = "Ferretera POS"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

    # Token configuration
    TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour for regular tokens
    PERSISTENT_TOKEN_EXPIRE_DAYS: int = 30  # 30 days for "remember me"
    RESET_TOKEN_EXPIRE_HOURS: int = 1  # 1 hour for password reset tokens

    # Roles predefinidos
    ROLES: list[str] = ["administrador", "vendedor", "almacen"]


settings = Settings()
