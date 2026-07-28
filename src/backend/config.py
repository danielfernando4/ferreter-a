# Configuración de la aplicación
# NOTA: En producción, usar variables de entorno para secretos

SECRET_KEY = "ferretera-mvp-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hora
REMEMBER_TOKEN_EXPIRE_DAYS = 30  # 30 días para "Recordar sesión"
RESET_TOKEN_EXPIRE_MINUTES = 60  # 1 hora para token de restablecimiento
