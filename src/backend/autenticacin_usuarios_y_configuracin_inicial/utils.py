import bcrypt
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REMEMBER_TOKEN_EXPIRE_DAYS, RESET_TOKEN_EXPIRE_HOURS


# --- Password Hashing ---

def _normalize_password(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def hash_password(pw: str) -> str:
    normalized = _normalize_password(pw).encode()
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    normalized = _normalize_password(plain).encode()
    return bcrypt.checkpw(normalized, hashed.encode())


# --- JWT Token Utilities ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def get_token_expires_seconds(remember: bool = False) -> int:
    if remember:
        return REMEMBER_TOKEN_EXPIRE_DAYS * 24 * 3600
    return ACCESS_TOKEN_EXPIRE_MINUTES * 60


def get_token_expires_delta(remember: bool = False) -> timedelta:
    if remember:
        return timedelta(days=REMEMBER_TOKEN_EXPIRE_DAYS)
    return timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)


# --- Random Token Generators ---

def generate_reset_token() -> str:
    return secrets.token_urlsafe(48)


def generate_session_token() -> str:
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_reset_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
