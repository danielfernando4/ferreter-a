import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    REMEMBER_TOKEN_EXPIRE_DAYS,
    RESET_TOKEN_EXPIRE_HOURS,
    SECRET_KEY,
)


# ─── Password Hashing ───────────────────────────────────────────────────────

def _normalize_password(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    normalized = _normalize_password(pw).encode()
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    normalized = _normalize_password(plain).encode()
    return bcrypt.checkpw(normalized, hashed.encode())


# ─── Token Generation ───────────────────────────────────────────────────────

def generate_session_token() -> str:
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_jwt_token(user_id: int, remember: bool = False) -> tuple[str, int]:
    """Returns (token, expires_in_seconds)."""
    if remember:
        expires_delta = timedelta(days=REMEMBER_TOKEN_EXPIRE_DAYS)
    else:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    expires_in = int(expires_delta.total_seconds())
    expire = datetime.now(timezone.utc) + expires_delta

    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token, expires_in


def decode_jwt_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None


def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)


def get_reset_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
