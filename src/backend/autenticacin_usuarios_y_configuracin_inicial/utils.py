import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    REMEMBER_TOKEN_EXPIRE_DAYS,
    RESET_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
)


# ─── Password Hashing (bcrypt + SHA-256 pre-hash) ─────────────────────

def _normalize_password(pw: str) -> str:
    """Pre-hash with SHA-256 to avoid bcrypt 72-byte truncation."""
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    """Hash a password using bcrypt with SHA-256 normalization."""
    normalized = _normalize_password(pw).encode()
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against a bcrypt hash."""
    normalized = _normalize_password(plain).encode()
    return bcrypt.checkpw(normalized, hashed.encode())


# ─── JWT Token Utilities ──────────────────────────────────────────────

def create_access_token(usuario_id: int, email: str, rol: str, remember: bool = False) -> str:
    """Create a JWT access token."""
    if remember:
        expires_delta = timedelta(days=REMEMBER_TOKEN_EXPIRE_DAYS)
    else:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    expires_at = datetime.now(timezone.utc) + expires_delta
    payload = {
        "sub": str(usuario_id),
        "email": email,
        "rol": rol,
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token, int(expires_delta.total_seconds())


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token. Returns payload dict or raises."""
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload


# ─── Token Generation (Cryptographically Random) ──────────────────────

def generate_reset_token() -> str:
    """Generate a cryptographically secure random token for password reset."""
    return secrets.token_urlsafe(48)


def generate_session_token() -> str:
    """Generate a cryptographically secure random session token."""
    return secrets.token_urlsafe(48)


# ─── Hashing Utilities for Stored Tokens ──────────────────────────────

def hash_token(token: str) -> str:
    """Hash a token for secure storage in the database."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
