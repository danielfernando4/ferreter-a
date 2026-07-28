import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt

from config import settings


def _normalize_password(pw: str) -> str:
    """SHA-256 normalize to avoid bcrypt 72-byte truncation."""
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    """Hash a password with bcrypt after SHA-256 normalization."""
    normalized = _normalize_password(pw).encode()
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against a bcrypt hash."""
    normalized = _normalize_password(plain).encode()
    return bcrypt.checkpw(normalized, hashed.encode())


def generate_token_string() -> str:
    """Generate a cryptographically secure random token string."""
    return str(uuid.uuid4()) + secrets.token_hex(32)


def hash_token(token: str) -> str:
    """Hash a token for secure storage using SHA-256."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(remember: bool = False) -> tuple[str, str, datetime]:
    """Generate an access token and return (raw_token, hashed_token, expires_at)."""
    raw_token = generate_token_string()
    hashed = hash_token(raw_token)
    if remember:
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REMEMBER_TOKEN_EXPIRE_DAYS)
    else:
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return raw_token, hashed, expires_at


def create_reset_token() -> tuple[str, str, datetime]:
    """Generate a password reset token and return (raw_token, hashed_token, expires_at)."""
    raw_token = generate_token_string()
    hashed = hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.RESET_TOKEN_EXPIRE_HOURS)
    return raw_token, hashed, expires_at
