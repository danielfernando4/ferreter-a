import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext

from config import (
    RESET_TOKEN_EXPIRE_MINUTES,
    TOKEN_EXPIRE_MINUTES,
    TOKEN_PERSISTENT_EXPIRE_DAYS,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def generate_session_token() -> str:
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def get_token_expiry(remember: bool = False) -> datetime:
    if remember:
        delta = timedelta(days=TOKEN_PERSISTENT_EXPIRE_DAYS)
    else:
        delta = timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return datetime.now(timezone.utc) + delta


def get_reset_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)


def expires_in_seconds(expiry: datetime) -> int:
    diff = expiry - datetime.now(timezone.utc)
    return max(0, int(diff.total_seconds()))
