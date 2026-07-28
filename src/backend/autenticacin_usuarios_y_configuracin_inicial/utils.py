"""Password hashing and token utilities."""

import hashlib
import secrets
import bcrypt
from datetime import datetime, timedelta, timezone


# ─── Password Hashing ──────────────────────────────────────────────────────────

def _normalize_password(pw: str) -> str:
    """SHA-256 pre-hash to avoid bcrypt 72-byte truncation."""
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    """Hash a password with bcrypt + SHA-256 pre-hash."""
    normalized = _normalize_password(pw).encode()
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against a bcrypt hash."""
    normalized = _normalize_password(plain).encode()
    return bcrypt.checkpw(normalized, hashed.encode())


# ─── Token Utilities ──────────────────────────────────────────────────────────

def generate_token() -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """Hash a token using SHA-256 for storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
