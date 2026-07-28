import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REMEMBER_TOKEN_EXPIRE_DAYS, RESET_TOKEN_EXPIRE_HOURS


# ─── Password Hashing ───

def _normalize_password(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    normalized = _normalize_password(pw).encode()
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    normalized = _normalize_password(plain).encode()
    return bcrypt.checkpw(normalized, hashed.encode())


# ─── Token Generation ───

def generate_random_token(length: int = 48) -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(length)


def hash_token(token: str) -> str:
    """Hash a token for secure storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ─── JWT Tokens ───

def create_access_token(data: dict, remember: bool = False) -> tuple[str, int]:
    """Create a JWT access token. Returns (token, expires_in_seconds)."""
    to_encode = data.copy()
    if remember:
        expires_delta = timedelta(days=REMEMBER_TOKEN_EXPIRE_DAYS)
    else:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    expires_in = int(expires_delta.total_seconds())
    return token, expires_in


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT access token. Returns payload or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# ─── Reset Token ───

def create_reset_token() -> tuple[str, str, datetime]:
    """Generate a reset token. Returns (raw_token, hashed_token, expiration)."""
    raw_token = generate_random_token(32)
    hashed = hash_token(raw_token)
    expiration = datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
    return raw_token, hashed, expiration
