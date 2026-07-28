import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext

from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _normalize_password(pw: str) -> str:
    """SHA-256 pre-hash prevents bcrypt 72-byte truncation."""
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    """Hash a password using bcrypt with SHA-256 pre-hashing."""
    return pwd_context.hash(_normalize_password(pw))


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain password against a bcrypt hash (with SHA-256 pre-hashing)."""
    return pwd_context.verify(_normalize_password(plain), hashed)


def generate_token() -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """Hash a token for secure storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def compute_token_expiry(remember: bool = False) -> datetime:
    """Compute token expiry datetime based on whether 'remember me' is set."""
    if remember:
        return datetime.now(timezone.utc) + timedelta(days=settings.PERSISTENT_TOKEN_EXPIRE_DAYS)
    return datetime.now(timezone.utc) + timedelta(minutes=settings.TOKEN_EXPIRE_MINUTES)


def compute_reset_token_expiry() -> datetime:
    """Compute reset token expiry datetime."""
    return datetime.now(timezone.utc) + timedelta(hours=settings.RESET_TOKEN_EXPIRE_HOURS)
