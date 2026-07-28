import hashlib
import secrets
from datetime import timedelta

SECRET_KEY = "ferretera-mvp-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REMEMBER_TOKEN_EXPIRE_DAYS = 30
RESET_TOKEN_EXPIRE_HOURS = 1

ROLES = {
    "administrador": "Acceso completo al sistema",
    "vendedor": "Acceso al punto de venta y clientes",
    "almacen": "Acceso a inventario y órdenes de compra",
}
