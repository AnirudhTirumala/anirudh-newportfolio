from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_admin

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _get_or_404(db: Session, project_id: int) -> models.Project:
    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def _rewrite_skill_links(db: Session, old_title: str, new_title: str | None) -> None:
    """Follow a project title through every skill that names it.

    `Skill.used_in` stores project titles rather than ids, and the public
    Skills section only renders an entry as a link when it matches a project
    title exactly. Renaming or deleting a project would otherwise silently
    demote every chip pointing at it to plain grey text, with nothing in the
    admin UI to explain why. Pass `new_title=None` to drop the reference.
    """
    if not old_title:
        return
    for skill in db.query(models.Skill).all():
        entries = skill.used_in or []
        if old_title not in entries:
            continue
        if new_title is None:
            skill.used_in = [entry for entry in entries if entry != old_title]
            continue
        # A rename can collide with an entry that already named the new title.
        skill.used_in = list(dict.fromkeys(new_title if entry == old_title else entry for entry in entries))


@router.get("", response_model=list[schemas.ProjectOut])
def list_projects(db: Session = Depends(get_db)) -> list[models.Project]:
    return db.query(models.Project).order_by(models.Project.sort_order, models.Project.id).all()


@router.get("/{slug}", response_model=schemas.ProjectOut)
def read_project(slug: str, db: Session = Depends(get_db)) -> models.Project:
    project = db.query(models.Project).filter(models.Project.slug == slug).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post("", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Project:
    existing = db.query(models.Project).filter(models.Project.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A project with this slug already exists")
    project = models.Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.put("/{project_id}", response_model=schemas.ProjectOut)
def update_project(
    project_id: int,
    payload: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Project:
    project = _get_or_404(db, project_id)
    data = payload.model_dump(exclude_unset=True)
    if "slug" in data and data["slug"] != project.slug:
        clash = db.query(models.Project).filter(models.Project.slug == data["slug"]).first()
        if clash:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A project with this slug already exists")
    previous_title = project.title
    for field, value in data.items():
        setattr(project, field, value)
    if project.title != previous_title:
        _rewrite_skill_links(db, previous_title, project.title)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> None:
    project = _get_or_404(db, project_id)
    _rewrite_skill_links(db, project.title, None)
    db.delete(project)
    db.commit()
