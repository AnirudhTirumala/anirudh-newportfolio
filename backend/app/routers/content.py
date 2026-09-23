"""
Education, certificates, and languages are all "small ordered list" resources
with the same shape of CRUD, so they share one router file. Each block below
is intentionally explicit rather than routed through a generic factory -
three short, obvious resources are easier to maintain than one clever
abstraction.
"""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import settings
from ..database import get_db
from ..image_uploads import read_verified_image
from ..security import get_current_admin

router = APIRouter(prefix="/api", tags=["content"])

# Certificate photos are the one place outside the Lumpy demo where the
# admin uploads real binary files, so this small helper set lives here
# rather than growing into a shared "files" module for a single use site.
def _certificates_upload_dir() -> Path:
    path = Path(settings.UPLOAD_DIR).resolve() / "certificates"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _delete_uploaded_file(url: str) -> None:
    """Best-effort delete of a previously uploaded file given its public
    `/uploads/...` URL. Never raises - a missing or already-gone file is
    fine, and a stale DB pointer shouldn't block the request that's trying
    to fix it."""
    if not url or not url.startswith("/uploads/"):
        return
    relative = url.removeprefix("/uploads/")
    certificate_dir = _certificates_upload_dir()
    full_path = (Path(settings.UPLOAD_DIR).resolve() / relative).resolve()
    # This route owns only direct files in /uploads/certificates. A database
    # value should never be able to target any other file, even if corrupted.
    if full_path.parent != certificate_dir:
        return
    try:
        full_path.unlink()
    except OSError:
        pass


def serialize_certificate(entry: models.Certificate) -> schemas.CertificateOut:
    """Read a certificate, dropping an image pointer whose file is gone.

    Uploads live on the container's own disk, so a redeploy or a restart can
    leave a row naming a file that no longer exists. The public card turns a
    non-empty image_url into a lightbox button and hides the external
    verification link behind it, so a dangling pointer is worse than no photo
    at all - reporting it as absent degrades the card back to its link.
    """
    certificate = schemas.CertificateOut.model_validate(entry)
    if certificate.image_url:
        filename = certificate.image_url.rsplit("/", 1)[-1]
        if not (_certificates_upload_dir() / filename).exists():
            certificate.image_url = ""
    return certificate


# ---------------------------------------------------------------------------
# Education
# ---------------------------------------------------------------------------
@router.get("/education", response_model=list[schemas.EducationOut])
def list_education(db: Session = Depends(get_db)) -> list[models.Education]:
    return db.query(models.Education).order_by(models.Education.sort_order, models.Education.id).all()


@router.post("/education", response_model=schemas.EducationOut, status_code=status.HTTP_201_CREATED)
def create_education(
    payload: schemas.EducationCreate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Education:
    entry = models.Education(**payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/education/{entry_id}", response_model=schemas.EducationOut)
def update_education(
    entry_id: int,
    payload: schemas.EducationUpdate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Education:
    entry = db.get(models.Education, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Education entry not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/education/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_education(
    entry_id: int,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> None:
    entry = db.get(models.Education, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Education entry not found")
    db.delete(entry)
    db.commit()


# ---------------------------------------------------------------------------
# Certificates
# ---------------------------------------------------------------------------
@router.get("/certificates", response_model=list[schemas.CertificateOut])
def list_certificates(db: Session = Depends(get_db)) -> list[schemas.CertificateOut]:
    rows = db.query(models.Certificate).order_by(models.Certificate.sort_order, models.Certificate.id).all()
    return [serialize_certificate(entry) for entry in rows]


@router.post("/certificates", response_model=schemas.CertificateOut, status_code=status.HTTP_201_CREATED)
def create_certificate(
    payload: schemas.CertificateCreate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Certificate:
    entry = models.Certificate(**payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/certificates/{entry_id}", response_model=schemas.CertificateOut)
def update_certificate(
    entry_id: int,
    payload: schemas.CertificateUpdate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Certificate:
    entry = db.get(models.Certificate, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/certificates/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certificate(
    entry_id: int,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> None:
    entry = db.get(models.Certificate, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
    image_url = entry.image_url
    db.delete(entry)
    db.commit()
    _delete_uploaded_file(image_url)


@router.post("/certificates/{entry_id}/image", response_model=schemas.CertificateOut)
async def upload_certificate_image(
    entry_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Certificate:
    entry = db.get(models.Certificate, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")

    contents, extension = await read_verified_image(file)

    # The new photo has to be on disk and recorded before the old one is
    # touched. Deleting first meant a failed write (a full or read-only
    # container disk) left the row pointing at a file that had already been
    # destroyed, and the original was unrecoverable.
    filename = f"cert-{entry.id}-{uuid.uuid4().hex[:10]}{extension}"
    try:
        (_certificates_upload_dir() / filename).write_bytes(contents)
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not save the image on the server. The existing photo is unchanged.",
        ) from exc

    previous_image_url = entry.image_url
    entry.image_url = f"/uploads/certificates/{filename}"
    db.commit()
    db.refresh(entry)

    # Only now that the replacement is stored is the old file safe to remove.
    _delete_uploaded_file(previous_image_url)
    return entry


@router.delete("/certificates/{entry_id}/image", response_model=schemas.CertificateOut)
def delete_certificate_image(
    entry_id: int,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Certificate:
    entry = db.get(models.Certificate, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
    previous_image_url = entry.image_url
    entry.image_url = ""
    db.commit()
    db.refresh(entry)
    _delete_uploaded_file(previous_image_url)
    return entry


# ---------------------------------------------------------------------------
# Languages
# ---------------------------------------------------------------------------
@router.get("/languages", response_model=list[schemas.LanguageOut])
def list_languages(db: Session = Depends(get_db)) -> list[models.Language]:
    return db.query(models.Language).order_by(models.Language.sort_order, models.Language.id).all()


@router.post("/languages", response_model=schemas.LanguageOut, status_code=status.HTTP_201_CREATED)
def create_language(
    payload: schemas.LanguageCreate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Language:
    entry = models.Language(**payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/languages/{entry_id}", response_model=schemas.LanguageOut)
def update_language(
    entry_id: int,
    payload: schemas.LanguageUpdate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.Language:
    entry = db.get(models.Language, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/languages/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_language(
    entry_id: int,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> None:
    entry = db.get(models.Language, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not found")
    db.delete(entry)
    db.commit()
