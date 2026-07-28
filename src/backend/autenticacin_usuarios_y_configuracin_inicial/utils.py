import bcrypt
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError

import config


# ─── Password Hashing ──────────────────────────────────────────────

def _normalize_password(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    normalized = _normalize_password(pw).encode()
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    normalized = _normalize_password(plain).encode()
    return bcrypt.checkpw(normalized, hashed.encode())


# ─── JWT Token Utilities ──────────────────────────────────────────

def create_access_token(usuario_id: int, remember: bool = False) -> dict:
    """Create a JWT access token. Returns dict with token, expires_in."""
    if remember:
        expire_minutes = config.REMEMBER_TOKEN_EXPIRE_DAYS * 24 * 60
    else:
        expire_minutes = config.ACCESS_TOKEN_EXPIRE_MINUTES

    expires_delta = timedelta(minutes=expire_minutes)
    expire = datetime.now(timezone.utc) + expires_delta

    payload = {
        "sub": str(usuario_id),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
        "remember": remember,
    }
    token = jwt.encode(payload, config.SECRET_KEY, algorithm=config.ALGORITHM)
    expires_in = int(expires_delta.total_seconds())
    return {"token": token, "expires_in": expires_in, "token_type": "bearer"}


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token. Returns payload dict or raises."""
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        if payload.get("type") != "access":
            raise ValueError("Invalid token type")
        return payload
    except JWTError:
        raise ValueError("Invalid or expired token")


# ─── Random Token for Reset ────────────────────────────────────────

def generate_reset_token() -> str:
    """Generate a cryptographically secure random token for password reset."""
    return secrets.token_urlsafe(48)


def hash_reset_token(token: str) -> str:
    """Hash a reset token for secure storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
