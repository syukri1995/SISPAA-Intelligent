from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from pydantic import BaseModel

from app.core.config import settings


class TokenPayload(BaseModel):
    sub: str  # user_id
    role: str
    agency: str | None = None
    exp: int


def hash_password(password: str) -> str:
    """Hash password using PBKDF2."""
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}${pwd_hash.hex()}"


def verify_password(password: str, hash: str) -> bool:
    """Verify password against hash."""
    try:
        salt, pwd_hash = hash.split("$")
        new_hash = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
        return new_hash.hex() == pwd_hash
    except Exception:
        return False


def create_access_token(user_id: str, role: str, agency: str | None = None, expires_in_hours: int | None = None) -> str:
    """Create JWT access token."""
    if expires_in_hours is None:
        expires_in_hours = settings.jwt_expiration_hours
    
    now = datetime.now(timezone.utc)
    expires = now + timedelta(hours=expires_in_hours)

    payload = TokenPayload(
        sub=user_id,
        role=role,
        agency=agency,
        exp=int(expires.timestamp()),
    )

    token = jwt.encode(payload.model_dump(), settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token


def decode_access_token(token: str) -> TokenPayload | None:
    """Decode JWT access token."""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return TokenPayload(**payload)
    except Exception:
        return None
