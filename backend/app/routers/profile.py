from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_admin

router = APIRouter(prefix="/api/profile", tags=["profile"])


def _get_or_404(db: Session) -> models.Profile:
    profile = db.get(models.Profile, 1)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not set up yet")
    return profile


@router.get("", response_model=schemas.ProfileOut)
def read_profile(db: Session = Depends(get_db)) -> models.Profile:
    return _get_or_404(db)


@router.put("", response_model=schemas.ProfileOut)
def update_profile(
    payload: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Profile:
    profile = db.get(models.Profile, 1)
    if not profile:
        profile = models.Profile(id=1)
        db.add(profile)
    for field, value in payload.model_dump().items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
