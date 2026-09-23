from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..database import get_db
from ..security import get_current_admin

router = APIRouter(prefix="/api/skills", tags=["skills"])


def _get_category_or_404(db: Session, category_id: int) -> models.SkillCategory:
    category = db.get(models.SkillCategory, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill category not found")
    return category


def _get_skill_or_404(db: Session, skill_id: int) -> models.Skill:
    skill = db.get(models.Skill, skill_id)
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    return skill


@router.get("", response_model=list[schemas.SkillCategoryOut])
def list_skill_categories(db: Session = Depends(get_db)) -> list[models.SkillCategory]:
    stmt = (
        db.query(models.SkillCategory)
        .options(selectinload(models.SkillCategory.skills))
        .order_by(models.SkillCategory.sort_order, models.SkillCategory.id)
    )
    return stmt.all()


@router.post("/categories", response_model=schemas.SkillCategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: schemas.SkillCategoryCreate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.SkillCategory:
    category = models.SkillCategory(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/categories/{category_id}", response_model=schemas.SkillCategoryOut)
def update_category(
    category_id: int,
    payload: schemas.SkillCategoryUpdate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.SkillCategory:
    category = _get_category_or_404(db, category_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> None:
    category = _get_category_or_404(db, category_id)
    db.delete(category)
    db.commit()


@router.post("", response_model=schemas.SkillOut, status_code=status.HTTP_201_CREATED)
def create_skill(
    payload: schemas.SkillCreate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Skill:
    _get_category_or_404(db, payload.category_id)
    skill = models.Skill(**payload.model_dump())
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.put("/{skill_id}", response_model=schemas.SkillOut)
def update_skill(
    skill_id: int,
    payload: schemas.SkillUpdate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Skill:
    skill = _get_skill_or_404(db, skill_id)
    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data:
        _get_category_or_404(db, data["category_id"])
    for field, value in data.items():
        setattr(skill, field, value)
    db.commit()
    db.refresh(skill)
    return skill


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> None:
    skill = _get_skill_or_404(db, skill_id)
    db.delete(skill)
    db.commit()
