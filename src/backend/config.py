# Configuración general del sistema

# JWT / Tokens
SECRET_KEY = "ferretera-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hora
REMEMBER_TOKEN_EXPIRE_DAYS = 30   # 30 días
RESET_TOKEN_EXPIRE_HOURS = 1      # 1 hora

# Roles predefinidos
ROLES = {
    "administrador": "Acceso completo al sistema",
    "vendedor": "Acceso al punto de venta y consulta de inventario",
    "almacen": "Acceso a inventario, órdenes de compra y productos",
}

# SMTP (para recuperación de contraseña - configurar en producción)
SMTP_HOST = ""
SMTP_PORT = 587
SMTP_USER = ""
SMTP_PASSWORD = ""
SMTP_FROM = "noreply@ferretera.com"
