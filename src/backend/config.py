import os
from datetime import timedelta

# JWT / Token configuration
SECRET_KEY: str = os.getenv("SECRET_KEY", "ferretera-secret-key-change-in-production")
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
REMEMBER_TOKEN_EXPIRE_DAYS: int = 30
RESET_TOKEN_EXPIRE_HOURS: int = 1

# Password reset
SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.mailtrap.io")
SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER: str = os.getenv("SMTP_USER", "")
SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply@ferretera.com")
APP_URL: str = os.getenv("APP_URL", "http://localhost:5173")

# Roles predefinidos
ROLES = {
    "administrador": "Acceso completo al sistema",
    "vendedor": "Acceso al punto de venta y consulta de inventario",
    "almacen": "Acceso a inventario, órdenes de compra y proveedores",
}
