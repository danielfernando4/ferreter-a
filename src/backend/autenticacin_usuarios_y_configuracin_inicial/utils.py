import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REMEMBER_TOKEN_EXPIRE_DAYS, RESET_TOKEN_EXPIRE_HOURS


def _normalize_password(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    normalized = _normalize_password(pw).encode()
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    normalized = _normalize_password(plain).encode()
    return bcrypt.checkpw(normalized, hashed.encode())


def generate_token(usuario_id: int, remember: bool = False) -> str:
    """Generate a JWT token for the given user."""
    if remember:
        expire = timedelta(days=REMEMBER_TOKEN_EXPIRE_DAYS)
    else:
        expire = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    expires_in = int(expire.total_seconds())
    payload = {
        "sub": str(usuario_id),
        "exp": datetime.now(timezone.utc) + expire,
        "type": "access",
        "remember": remember,
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token, expires_in


def decode_token(token: str) -> dict:
    """Decode a JWT token, returning the payload. Raises on invalid/expired."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def generate_reset_token() -> str:
    """Generate a cryptographically secure random token for password reset."""
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """Hash a token for storage (SHA-256)."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_reset_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
