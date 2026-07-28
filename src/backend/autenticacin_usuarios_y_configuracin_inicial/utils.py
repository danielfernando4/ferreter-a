import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from config import settings


# ─── Password Hashing ──────────────────────────────────────────────────

def _normalize_password(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    normalized = _normalize_password(pw).encode()
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    normalized = _normalize_password(plain).encode()
    return bcrypt.checkpw(normalized, hashed.encode())


# ─── Token Generation ──────────────────────────────────────────────────

def generate_random_token() -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """Hash a token for secure storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_jwt_token(usuario_id: int, email: str, rol: str, remember: bool = False) -> str:
    """Create a JWT access token."""
    if remember:
        expire_minutes = settings.REMEMBER_TOKEN_EXPIRE_DAYS * 24 * 60
    else:
        expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES

    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    payload = {
        "sub": str(usuario_id),
        "email": email,
        "rol": rol,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token


def decode_jwt_token(token: str) -> dict | None:
    """Decode and validate a JWT token. Returns payload dict or None if invalid."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def get_token_expires_in(token: str) -> int:
    """Get remaining seconds until token expiration."""
    payload = decode_jwt_token(token)
    if payload is None:
        return 0
    exp = payload.get("exp")
    if exp is None:
        return 0
    remaining = exp - datetime.now(timezone.utc).timestamp()
    return max(0, int(remaining))
