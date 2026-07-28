import bcrypt
import hashlib
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from config import settings


# ───── Password Hashing (bcrypt with SHA-256 pre-hash to avoid 72-byte truncation) ─────

def _normalize_password(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    normalized = _normalize_password(pw).encode()
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    normalized = _normalize_password(plain).encode()
    return bcrypt.checkpw(normalized, hashed.encode())


# ───── Token Generation ─────

def generate_token() -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """Hash a token for secure storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_token_expiry(remember: bool = False) -> datetime:
    """Get expiry datetime for a token."""
    if remember:
        return datetime.now(timezone.utc) + timedelta(days=settings.REMEMBER_TOKEN_EXPIRE_DAYS)
    return datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)


def get_reset_token_expiry() -> datetime:
    """Get expiry datetime for a reset token."""
    return datetime.now(timezone.utc) + timedelta(hours=settings.RESET_TOKEN_EXPIRE_HOURS)


def get_expires_in_seconds(expiry: datetime) -> int:
    """Calculate seconds until expiry."""
    diff = expiry - datetime.now(timezone.utc)
    return max(0, int(diff.total_seconds()))
