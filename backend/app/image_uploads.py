"""Shared, bounded validation for every image received by the API."""

import warnings
from io import BytesIO

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from .config import settings

_CONTENT_TYPE_TO_FORMAT = {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WEBP",
}
_FORMAT_TO_EXTENSION = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}
_INVALID_IMAGE_DETAIL = "Please upload a valid JPEG, PNG, or WEBP image."
# Importing Ultralytics later monkey-patches ``PIL.Image.open`` to attempt a
# HEIF-plugin installation after *any* invalid image. Keep Pillow's original
# decoder for this security boundary: malformed bytes must be rejected quickly
# with a 400, never trigger package management or leak a dependency exception.
_PILLOW_IMAGE_OPEN = Image.open


async def read_verified_image(file: UploadFile) -> tuple[bytes, str]:
    """Read at most the configured limit and confirm the actual image bytes.

    `content_type` and a filename are client-provided hints, not proof. Pillow
    verifies the encoded image and its decoded dimensions before any file is
    retained or passed to model inference.
    """
    expected_format = _CONTENT_TYPE_TO_FORMAT.get(file.content_type or "")
    if not expected_format:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=_INVALID_IMAGE_DETAIL)

    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    contents = await file.read(max_bytes + 1)
    if len(contents) > max_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Image is larger than {settings.MAX_UPLOAD_MB}MB.")
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="That file looks empty.")

    try:
        # Pillow normally emits a warning for decompression bombs. Treat it as
        # an invalid upload, rather than allocating memory to process it.
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            image = _PILLOW_IMAGE_OPEN(BytesIO(contents))
            actual_format = image.format
            image.verify()
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=_INVALID_IMAGE_DETAIL) from None

    if actual_format != expected_format:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=_INVALID_IMAGE_DETAIL)
    return contents, _FORMAT_TO_EXTENSION[actual_format]


# A PDF's first bytes. Same principle as the image check above: the browser's
# `content_type` and the filename are client-supplied hints, so the bytes get
# the final say before anything is written to disk and later served back.
_PDF_MAGIC = b"%PDF-"
_INVALID_PDF_DETAIL = "Please upload a PDF file."


async def read_verified_pdf(file: UploadFile) -> bytes:
    """Read at most the configured limit and confirm the bytes really are a PDF."""
    if (file.content_type or "").split(";")[0].strip() != "application/pdf":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=_INVALID_PDF_DETAIL)

    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    contents = await file.read(max_bytes + 1)
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"That PDF is larger than {settings.MAX_UPLOAD_MB}MB.",
        )
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="That file looks empty.")
    if not contents.startswith(_PDF_MAGIC):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=_INVALID_PDF_DETAIL)
    return contents
