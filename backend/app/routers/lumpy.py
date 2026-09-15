"""
Powers the interactive dashboard on the Lumpy Skin Disease Detection project
page. Two modes, chosen automatically:

1. Real inference - if LUMPY_MODEL_PATH points at a trained Ultralytics
   YOLO .pt file and the `ultralytics` package is installed, uploaded photos
   are run through the actual model.
2. Demo mode - otherwise, a deterministic "simulated" detection is derived
   from the image bytes (same photo always gives the same demo result) so
   the dashboard is still a real, working interaction. Every demo response
   is clearly flagged with is_demo=True so nobody mistakes it for a live
   diagnosis.

To go live: train your model, drop the .pt file anywhere on the server, and
set LUMPY_MODEL_PATH (plus `pip install ultralytics`).
"""

import hashlib
import os
import random
from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from PIL import Image
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import settings
from ..database import get_db
from ..image_uploads import read_verified_image
from ..security import get_current_admin, rate_limiter

router = APIRouter(prefix="/api/lumpy", tags=["lumpy"])

# Public-by-design (no login needed to try the scanner) but still capped per
# IP - each call runs a model/CPU inference and writes a DB row, so this is
# the endpoint's defense against being hammered by a script.
_detect_rate_limit = rate_limiter("lumpy_detect", max_requests=30, window_seconds=600)

try:
    from ultralytics import YOLO

    _ULTRALYTICS_AVAILABLE = True
except ImportError:  # pragma: no cover - exercised only when the extra isn't installed
    YOLO = None  # type: ignore[assignment]
    _ULTRALYTICS_AVAILABLE = False

_model = None
_model_load_attempted = False

def get_model():
    """Lazily loads and caches the YOLO model. Returns None in demo mode."""
    global _model, _model_load_attempted
    if _model_load_attempted:
        return _model
    _model_load_attempted = True
    if not _ULTRALYTICS_AVAILABLE or not settings.LUMPY_MODEL_PATH:
        return None
    if not os.path.isfile(settings.LUMPY_MODEL_PATH):
        return None
    try:
        _model = YOLO(settings.LUMPY_MODEL_PATH)
    except Exception:
        _model = None
    return _model


def _run_real_inference(model, contents: bytes) -> schemas.DetectionResult:
    image = Image.open(BytesIO(contents)).convert("RGB")
    results = model.predict(image, conf=settings.LUMPY_CONFIDENCE_THRESHOLD, verbose=False)
    r = results[0]
    names = r.names if hasattr(r, "names") else {}

    boxes: list[schemas.BoundingBox] = []
    if r.boxes is not None:
        for box in r.boxes:
            x1, y1, x2, y2 = box.xyxyn[0].tolist()
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            label = names.get(cls_id, "lesion") if isinstance(names, dict) else str(cls_id)
            boxes.append(
                schemas.BoundingBox(
                    x=x1,
                    y=y1,
                    width=x2 - x1,
                    height=y2 - y1,
                    label=str(label),
                    confidence=round(conf, 4),
                )
            )

    top_confidence = max((b.confidence for b in boxes), default=0.0)
    return schemas.DetectionResult(
        result="positive" if boxes else "negative",
        confidence=top_confidence,
        boxes=boxes,
        is_demo=False,
    )


def _run_demo_inference(contents: bytes) -> schemas.DetectionResult:
    digest = hashlib.sha256(contents).hexdigest()
    rng = random.Random(digest)
    is_positive = rng.random() < 0.5

    boxes: list[schemas.BoundingBox] = []
    if is_positive:
        for _ in range(rng.randint(1, 3)):
            w = rng.uniform(0.12, 0.28)
            h = rng.uniform(0.12, 0.28)
            x = rng.uniform(0.05, max(0.06, 0.9 - w))
            y = rng.uniform(0.05, max(0.06, 0.9 - h))
            boxes.append(
                schemas.BoundingBox(
                    x=round(x, 4),
                    y=round(y, 4),
                    width=round(w, 4),
                    height=round(h, 4),
                    label="lumpy nodule",
                    confidence=round(rng.uniform(0.62, 0.95), 4),
                )
            )

    fallback_confidence = round(rng.uniform(0.05, 0.2), 4)
    top_confidence = max((b.confidence for b in boxes), default=fallback_confidence)
    return schemas.DetectionResult(
        result="positive" if is_positive else "negative",
        confidence=top_confidence,
        boxes=boxes,
        is_demo=True,
        note="Demo mode - this is a simulated result. Set LUMPY_MODEL_PATH to a trained YOLO model for real inference.",
    )


@router.post("/detect", response_model=schemas.DetectionResult, dependencies=[Depends(_detect_rate_limit)])
async def detect(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> schemas.DetectionResult:
    contents, _ = await read_verified_image(file)

    model = get_model()
    try:
        if model is not None:
            result = _run_real_inference(model, contents)
        else:
            result = _run_demo_inference(contents)
    except Exception:
        # Keep the dashboard usable even if a single image fails to decode -
        # but don't echo the raw exception text back to the client, since it
        # can leak internal file paths or library details.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read that image. Please try a different JPEG, PNG, or WEBP file.",
        ) from None

    db.add(
        models.DetectionLog(
            # Retain no client-provided filename: it can contain a person's
            # name or other metadata, while stats do not need it.
            filename="uploaded-image",
            result=result.result,
            confidence=result.confidence,
            is_demo=result.is_demo,
        )
    )
    db.commit()
    return result


@router.get("/stats", response_model=schemas.LumpyStatsOut)
def stats(
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> schemas.LumpyStatsOut:
    total = db.query(models.DetectionLog).count()
    positive = db.query(models.DetectionLog).filter(models.DetectionLog.result == "positive").count()
    recent = db.query(models.DetectionLog).order_by(models.DetectionLog.created_at.desc()).limit(8).all()
    return schemas.LumpyStatsOut(
        total_scans=total,
        positive_count=positive,
        negative_count=total - positive,
        positive_rate=round((positive / total) * 100, 1) if total else 0.0,
        model_loaded=get_model() is not None,
        recent=recent,
    )
