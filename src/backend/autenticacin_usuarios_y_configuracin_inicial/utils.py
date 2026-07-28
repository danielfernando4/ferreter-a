import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt

from config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REMEMBER_TOKEN_EXPIRE_DAYS,
    RESET_TOKEN_EXPIRE_HOURS,
    SECRET_KEY,
    ALGORITHM,
)


# ─── Password Hashing ───────────────────────────────────────────────────
def _normalize_password(pw: str) -> str:
    """Normalize password by SHA-256 hashing to avoid bcrypt 72-byte truncation."""
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    normalized = _normalize_password(pw).encode()
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    normalized = _normalize_password(plain).encode()
    return bcrypt.checkpw(normalized, hashed.encode())


# ─── Token Generation ───────────────────────────────────────────────────
def generate_session_token() -> str:
    """Generate a cryptographically random session token."""
    return secrets.token_urlsafe(48)


def compute_token_hash(token: str) -> str:
    """Hash a token for secure storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_session_expiry(remember: bool = False) -> datetime:
    """Get expiry datetime for a session token."""
    if remember:
        delta = timedelta(days=REMEMBER_TOKEN_EXPIRE_DAYS)
    else:
        delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return datetime.now(timezone.utc) + delta


def get_reset_token_expiry() -> datetime:
    """Get expiry datetime for a password reset token."""
    return datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
