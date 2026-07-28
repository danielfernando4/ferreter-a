import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext

from config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    REMEMBER_TOKEN_EXPIRE_DAYS,
    RESET_TOKEN_EXPIRE_HOURS,
    SECRET_KEY,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password with bcrypt, pre-hashing with SHA-256 to avoid 72-byte limit."""
    normalized = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(normalized)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    normalized = hashlib.sha256(plain_password.encode()).hexdigest()
    return pwd_context.verify(normalized, hashed_password)


def generate_token() -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """Hash a token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def get_token_expiry(remember: bool = False) -> datetime:
    """Get the expiry datetime for a token."""
    if remember:
        delta = timedelta(days=REMEMBER_TOKEN_EXPIRE_DAYS)
    else:
        delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return datetime.now(timezone.utc) + delta


def get_reset_token_expiry() -> datetime:
    """Get the expiry datetime for a reset token."""
    return datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)


def get_expires_in_seconds(expiry: datetime) -> int:
    """Get the number of seconds until expiry."""
    now = datetime.now(timezone.utc)
    delta = expiry - now
    return max(0, int(delta.total_seconds()))
