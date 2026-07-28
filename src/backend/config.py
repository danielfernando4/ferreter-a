import os


class Settings:
    APP_NAME: str = "Ferretería - Sistema de Gestión"
    VERSION: str = "1.0.0"

    # Token settings
    TOKEN_EXPIRATION_MINUTES: int = 60
    TOKEN_EXPIRATION_PERSISTENT_DAYS: int = 30
    RESET_TOKEN_EXPIRATION_HOURS: int = 1

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./ferretera.db"

    # SMTP (placeholder - no real sending in MVP)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "noreply@ferreteria.local")


settings = Settings()
