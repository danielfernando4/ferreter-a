import bcrypt
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from jose import jwt
from jose.exceptions import JWTError

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REMEMBER_TOKEN_EXPIRE_DAYS, RESET_TOKEN_EXPIRE_HOURS


# ────────────────────────────
# Password hashing (bcrypt + SHA-256)
# ────────────────────────────

def _normalize_password(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    normalized = _normalize_password(pw).encode()
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    normalized = _normalize_password(plain).encode()
    return bcrypt.checkpw(normalized, hashed.encode())


# ────────────────────────────
# JWT Token utilities
# ────────────────────────────

def create_access_token(usuario_id: int, remember: bool = False) -> tuple[str, int]:
    """Create a JWT access token. Returns (token, expires_in_seconds)."""
    if remember:
        expire_minutes = REMEMBER_TOKEN_EXPIRE_DAYS * 24 * 60
    else:
        expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES

    expires_in = int(expire_minutes * 60)
    expire_dt = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)

    payload = {
        "sub": str(usuario_id),
        "exp": expire_dt,
        "iat": datetime.now(timezone.utc),
        "type": "access",
        "remember": remember,
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token, expires_in


def decode_access_token(token: str) -> dict | None:
    """Decode and validate a JWT token. Returns payload dict or None if invalid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


# ────────────────────────────
# Random token generation
# ────────────────────────────

def generate_reset_token() -> str:
    """Generate a cryptographically secure random token for password reset."""
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """Hash a token for storage (SHA-256)."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_reset_token_expiry() -> datetime:
    """Get the expiry datetime for a reset token."""
    return datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
