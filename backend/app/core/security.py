"""Authentication primitives: password hashing and JWT session tokens.

Passwords are hashed with bcrypt. Sessions are stateless JWTs signed with
JWT_SECRET (set in backend/.env). The frontend stores the token and sends it
as `Authorization: Bearer <token>` on requests that need a signed-in user.
"""
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is not set. Add it to backend/.env")

JWT_ALGORITHM = "HS256"
# How long a login stays valid before the user must sign in again.
TOKEN_TTL_HOURS = int(os.getenv("JWT_TTL_HOURS", "168"))  # 7 days default

# bcrypt operates on at most 72 bytes; longer passwords are silently truncated
# by the algorithm, so we cap explicitly to make the behaviour obvious.
_BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    pw = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    pw = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    try:
        return bcrypt.checkpw(pw, password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "iat": now,
        "exp": now + timedelta(hours=TOKEN_TTL_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


_bearer = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency that resolves the signed-in user from the JWT.

    Raises 401 if the token is missing, malformed, expired, or the user no
    longer exists.
    """
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired session. Please sign in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM]
        )
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise unauthorized

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise unauthorized
    return user


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Like get_current_user, but rejects non-staff accounts with 403.

    Every /admin route depends on this — the frontend guard is only cosmetic,
    the real check happens here.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins only.",
        )
    return current_user
