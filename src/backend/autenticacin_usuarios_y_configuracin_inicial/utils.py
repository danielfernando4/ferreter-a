import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt


def _normalize_password(pw: str) -> str:
    """Normalize password to avoid bcrypt 72-byte truncation."""
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    """Hash a password using bcrypt with pre-hashing to avoid 72-byte limit."""
    normalized = _normalize_password(pw).encode()
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    normalized = _normalize_password(plain).encode()
    return bcrypt.checkpw(normalized, hashed.encode())


def generate_token() -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """Hash a token for secure storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_token_expiry(days: int = 7) -> datetime:
    """Get expiration datetime for a token."""
    return datetime.now(timezone.utc) + timedelta(days=days)


def get_reset_token_expiry(hours: int = 1) -> datetime:
    """Get expiration datetime for a reset token."""
    return datetime.now(timezone.utc) + timedelta(hours=hours)
