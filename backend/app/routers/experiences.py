"""Public experience reads and admin-only experience management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_admin

router = APIRouter(prefix="/api/experiences", tags=["experiences"])


def _get_or_404(db: Session, experience_id: int) -> models.Experience:
    experience = db.get(models.Experience, experience_id)
    if not experience:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience entry not found")
    return experience


@router.get("", response_model=list[schemas.ExperienceOut])
def list_experiences(db: Session = Depends(get_db)) -> list[models.Experience]:
    return db.query(models.Experience).order_by(models.Experience.sort_order, models.Experience.id).all()


@router.post("", response_model=schemas.ExperienceOut, status_code=status.HTTP_201_CREATED)
def create_experience(
    payload: schemas.ExperienceCreate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Experience:
    experience = models.Experience(**payload.model_dump())
    db.add(experience)
    db.commit()
    db.refresh(experience)
    return experience


@router.put("/{experience_id}", response_model=schemas.ExperienceOut)
def update_experience(
    experience_id: int,
    payload: schemas.ExperienceUpdate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Experience:
    experience = _get_or_404(db, experience_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(experience, field, value)
    db.commit()
    db.refresh(experience)
    return experience


@router.delete("/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(
    experience_id: int,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> None:
    db.delete(_get_or_404(db, experience_id))
    db.commit()
