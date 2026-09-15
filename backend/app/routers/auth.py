from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import (
    DUMMY_HASH,
    check_login_throttle,
    clear_failed_logins,
    create_access_token,
    get_current_admin,
    record_failed_login,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> schemas.Token:
    check_login_throttle(request)

    admin = db.query(models.AdminUser).filter(models.AdminUser.username == form_data.username).first()
    # Always run verify_password, even for a username that doesn't exist, by
    # checking against a dummy hash in that case. Short-circuiting on "no
    # such user" would make that response measurably faster than a wrong
    # password on a real account - a timing side-channel that lets someone
    # enumerate valid usernames without ever seeing a different error message.
    password_ok = verify_password(form_data.password, admin.hashed_password if admin else DUMMY_HASH)
    if not admin or not password_ok:
        record_failed_login(request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    clear_failed_logins(request)
    token = create_access_token(subject=admin.username)
    return schemas.Token(access_token=token)


@router.get("/me", response_model=schemas.AdminOut)
def read_me(current_admin: models.AdminUser = Depends(get_current_admin)) -> models.AdminUser:
    return current_admin
