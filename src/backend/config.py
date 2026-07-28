import os

SECRET_KEY = os.getenv("SECRET_KEY", "ferretera-mvp-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hora
REMEMBER_TOKEN_EXPIRE_DAYS = 30
RESET_TOKEN_EXPIRE_HOURS = 1
