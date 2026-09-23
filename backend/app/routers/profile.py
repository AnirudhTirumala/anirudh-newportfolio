import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import settings
from ..database import get_db
from ..image_uploads import read_verified_pdf
from ..security import get_current_admin

router = APIRouter(prefix="/api/profile", tags=["profile"])

# The résumé is the one file the owner uploads that is not an image, so its
# small amount of path handling lives here rather than in a shared module for
# a single use site.
_RESUME_PREFIX = "/uploads/resume/"


def _resume_dir() -> Path:
    path = Path(settings.UPLOAD_DIR).resolve() / "resume"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _delete_uploaded_resume(url: str) -> None:
    """Best-effort delete of a previously uploaded résumé.

    Never raises: a missing file, or a stored value that points at an external
    URL rather than an upload, must not block the request trying to replace it.
    """
    if not url or not url.startswith(_RESUME_PREFIX):
        return
    full_path = (Path(settings.UPLOAD_DIR).resolve() / url.removeprefix("/uploads/")).resolve()
    # This route owns only direct files in /uploads/resume. A corrupted stored
    # value must never be able to target anything else.
    if full_path.parent != _resume_dir():
        return
    try:
        full_path.unlink()
    except OSError:
        pass


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
    # `exclude_unset` matters a great deal here. Every field on ProfileUpdate
    # defaults to "", so a plain model_dump() turned a request carrying only
    # one field into a full overwrite that blanked name, bio, email and every
    # link. Only fields the client actually sent are applied now; anything
    # omitted keeps its stored value.
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/resume", response_model=schemas.ProfileOut)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Profile:
    """Store an uploaded résumé PDF and point `resume_url` at it.

    `resume_url` accepts either an external link or an upload, so replacing one
    with the other is just a write. The previous upload is removed so old
    résumés don't accumulate on disk (and stay downloadable) after a new one is
    published.
    """
    profile = db.get(models.Profile, 1)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile is not set up yet")

    contents = await read_verified_pdf(file)
    _delete_uploaded_resume(profile.resume_url)

    filename = f"resume-{uuid.uuid4().hex[:10]}.pdf"
    (_resume_dir() / filename).write_bytes(contents)

    profile.resume_url = f"{_RESUME_PREFIX}{filename}"
    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/resume", response_model=schemas.ProfileOut)
def delete_resume(
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Profile:
    """Remove the résumé. Clears an external link just as well as an upload."""
    profile = db.get(models.Profile, 1)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile is not set up yet")

    _delete_uploaded_resume(profile.resume_url)
    profile.resume_url = ""
    db.commit()
    db.refresh(profile)
    return profile
