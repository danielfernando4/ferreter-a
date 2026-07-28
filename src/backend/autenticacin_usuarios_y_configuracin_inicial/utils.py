import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _normalize_password(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    # SHA-256 pre-hash prevents bcrypt 72-byte truncation
    return pwd_context.hash(_normalize_password(pw))


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(_normalize_password(plain), hashed)


def generate_token(length: int = 48) -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_hex(length)


def hash_token(token: str) -> str:
    """Hash a token for secure storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_token_expiry(persistent: bool = False) -> datetime:
    """Return expiry datetime for a token."""
    if persistent:
        return datetime.now(timezone.utc) + timedelta(days=30)
    return datetime.now(timezone.utc) + timedelta(hours=8)
