import re
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt

PASSWORD_MIN_LENGTH = 8
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
SESSION_DURATION_MINUTES = 15


def generate_uuid() -> str:
    return str(uuid.uuid4())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')


def check_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


def validate_password_policy(password: str) -> tuple[bool, str]:
    """Returns (is_valid, error_message)."""
    if len(password) < PASSWORD_MIN_LENGTH:
        return False, f"La contraseña debe tener al menos {PASSWORD_MIN_LENGTH} caracteres"
    if not re.search(r'[A-Z]', password):
        return False, "La contraseña debe contener al menos una mayúscula"
    if not re.search(r'\d', password):
        return False, "La contraseña debe contener al menos un número"
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;\'/`~]', password):
        return False, "La contraseña debe contener al menos un carácter especial"
    return True, ""


def generate_token() -> str:
    return generate_uuid()


def get_lockout_time() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)


def get_session_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=SESSION_DURATION_MINUTES)
