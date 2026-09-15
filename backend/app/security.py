import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from . import models
from .config import settings
from .database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_current_admin(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.AdminUser:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise unauthorized
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise unauthorized
    except JWTError as exc:
        raise unauthorized from exc

    admin = db.query(models.AdminUser).filter(models.AdminUser.username == username).first()
    if admin is None:
        raise unauthorized
    return admin


# ---------------------------------------------------------------------------
# A minimal in-memory login throttle. This is a single-admin portfolio site,
# not a multi-tenant SaaS, so we don't need Redis for this - a process-local
# dict is enough to blunt brute-force attempts. It resets on restart, which
# is an acceptable trade-off here.
# ---------------------------------------------------------------------------
_MAX_ATTEMPTS = 5
_WINDOW_SECONDS = 15 * 60
_failed_attempts: dict[str, list[float]] = defaultdict(list)

# A bcrypt hash of a value nobody will ever type, used purely so a login for
# a nonexistent username still pays the same bcrypt cost as a real one -
# otherwise "no such user" answers measurably faster than "wrong password"
# and becomes a username-enumeration timing oracle.
DUMMY_HASH = bcrypt.hashpw(b"not-a-real-password", bcrypt.gensalt()).decode("utf-8")


def _client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def check_login_throttle(request: Request) -> None:
    key = _client_key(request)
    now = time.time()
    attempts = [t for t in _failed_attempts[key] if now - t < _WINDOW_SECONDS]
    _failed_attempts[key] = attempts
    if len(attempts) >= _MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please wait a few minutes and try again.",
        )


def record_failed_login(request: Request) -> None:
    key = _client_key(request)
    _failed_attempts[key].append(time.time())


def clear_failed_logins(request: Request) -> None:
    key = _client_key(request)
    _failed_attempts.pop(key, None)


# ---------------------------------------------------------------------------
# General-purpose request throttle for public, potentially-costly endpoints
# (the JanSeva LLM chat, the Lumpy image scanner, service-request creation).
# These have no login to gate them - by design, portfolio visitors use them
# without an account - so instead each is capped per client IP. Same
# process-local, no-Redis trade-off as the login throttle above: fine for a
# single-instance portfolio deployment, not meant to scale past that.
# ---------------------------------------------------------------------------
_rate_buckets: dict[str, list[float]] = defaultdict(list)


def rate_limiter(name: str, max_requests: int, window_seconds: int):
    """Returns a FastAPI dependency that allows `max_requests` calls per
    `window_seconds`, per client IP, per named bucket."""

    def _dependency(request: Request) -> None:
        key = f"{name}:{_client_key(request)}"
        now = time.time()
        attempts = [t for t in _rate_buckets[key] if now - t < window_seconds]
        if len(attempts) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait a bit and try again.",
            )
        attempts.append(now)
        _rate_buckets[key] = attempts

    return _dependency
