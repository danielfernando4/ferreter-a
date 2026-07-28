import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt

from config import settings


def _normalize_password(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    # SHA-256 pre-hash prevents bcrypt 72-byte truncation
    normalized = _normalize_password(pw).encode()
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    normalized = _normalize_password(plain).encode()
    return bcrypt.checkpw(normalized, hashed.encode())


def generate_token() -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """Hash a token for secure storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_token_expiration(persistent: bool = False) -> datetime:
    """Get expiration datetime for a token."""
    if persistent:
        delta = timedelta(days=settings.TOKEN_EXPIRATION_PERSISTENT_DAYS)
    else:
        delta = timedelta(minutes=settings.TOKEN_EXPIRATION_MINUTES)
    return datetime.now(timezone.utc) + delta


def get_reset_token_expiration() -> datetime:
    """Get expiration datetime for a reset token."""
    delta = timedelta(hours=settings.RESET_TOKEN_EXPIRATION_HOURS)
    return datetime.now(timezone.utc) + delta
