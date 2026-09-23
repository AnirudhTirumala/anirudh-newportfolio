"""
Pydantic v2 schemas. Kept separate from the SQLAlchemy models in models.py
on purpose - the database shape and the API shape are allowed to drift
independently as the site grows.
"""

from datetime import datetime
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _validate_external_url(value: str) -> str:
    value = value.strip()
    if not value:
        return ""
    parsed = urlparse(value)
    if parsed.scheme not in {"https", "http"} or not parsed.netloc:
        raise ValueError("URL must be an absolute http or https address")
    return value


def _require_text(value: str) -> str:
    """Reject a value that is blank once trimmed, and store the trimmed form.

    `min_length` alone still admits a run of spaces. The admin credential
    forms post an empty string for every field the owner never touched, and a
    row saved with a blank name renders on the public page as an unlabelled
    card that can only be found again by deleting rows one at a time.
    """
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("This field is required")
    return cleaned


def _validate_resume_url(value: str) -> str:
    """Accept either an external link or a résumé uploaded through the admin.

    `resume_url` is the one profile field that can hold either kind of value:
    the owner can paste a link to a hosted PDF, or upload the file here and
    have it served from `/uploads/resume/`. An upload path is not an absolute
    URL, so it has to be recognised explicitly rather than being rejected by
    the external-URL rule.
    """
    value = value.strip()
    if not value:
        return ""
    prefix = "/uploads/resume/"
    if value.startswith(prefix):
        filename = value.removeprefix(prefix)
        if not filename or "/" in filename or "\\" in filename or not filename.lower().endswith(".pdf"):
            raise ValueError("resume_url must reference an uploaded PDF")
        return value
    return _validate_external_url(value)


def _validate_certificate_image_path(value: str) -> str:
    value = value.strip()
    if not value:
        return ""
    prefix = "/uploads/certificates/"
    filename = value.removeprefix(prefix)
    if not value.startswith(prefix) or not filename or "/" in filename or "\\" in filename:
        raise ValueError("image_url must reference an uploaded certificate image")
    if not filename.lower().endswith((".jpg", ".png", ".webp")):
        raise ValueError("certificate image must be a JPEG, PNG, or WEBP file")
    return value


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    username: str


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------
# Every `max_length` below mirrors the width of the column it is written to
# in models.py. Without them an over-long value passes validation and only
# fails at the driver: SQLite ignores VARCHAR(n) so local editing looks fine,
# while Postgres raises 22001 and the admin gets an opaque 500 with no idea
# which field was at fault. Matching the column here turns that into a 422
# naming the field, which the admin forms already render.
class ProfileBase(BaseModel):
    name: str = Field(default="", max_length=120)
    title: str = Field(default="", max_length=160)
    tagline: str = ""
    bio: str = ""
    email: str = Field(default="", max_length=160)
    phone: str = Field(default="", max_length=40)
    location: str = Field(default="", max_length=120)
    github_url: str = Field(default="", max_length=255)
    linkedin_url: str = Field(default="", max_length=255)
    resume_url: str = Field(default="", max_length=255)

    @field_validator("github_url", "linkedin_url")
    @classmethod
    def validate_external_urls(cls, value: str) -> str:
        return _validate_external_url(value)

    @field_validator("resume_url")
    @classmethod
    def validate_resume(cls, value: str) -> str:
        return _validate_resume_url(value)


class ProfileOut(ProfileBase):
    model_config = ConfigDict(from_attributes=True)
    updated_at: datetime


class ProfileUpdate(ProfileBase):
    pass


# ---------------------------------------------------------------------------
# Experience
# ---------------------------------------------------------------------------
class ExperienceBase(BaseModel):
    company: str = Field(..., min_length=1, max_length=160)
    role: str = Field(..., min_length=1, max_length=160)
    location: str = Field(default="", max_length=160)
    start_date: str = Field(default="", max_length=60)
    end_date: str = Field(default="", max_length=60)
    current: bool = False
    description: str = Field(default="", max_length=2000)
    highlights: list[str] = Field(default_factory=list, max_length=8)
    sort_order: int = 0

    @field_validator("highlights")
    @classmethod
    def validate_highlights(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values if value.strip()]
        if any(len(value) > 180 for value in cleaned):
            raise ValueError("Each experience highlight must be at most 180 characters")
        return cleaned


class ExperienceOut(ExperienceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(BaseModel):
    company: str | None = Field(default=None, min_length=1, max_length=160)
    role: str | None = Field(default=None, min_length=1, max_length=160)
    location: str | None = Field(default=None, max_length=160)
    start_date: str | None = Field(default=None, max_length=60)
    end_date: str | None = Field(default=None, max_length=60)
    current: bool | None = None
    description: str | None = Field(default=None, max_length=2000)
    highlights: list[str] | None = Field(default=None, max_length=8)
    sort_order: int | None = None

    @field_validator("highlights")
    @classmethod
    def validate_highlights(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return values
        cleaned = [value.strip() for value in values if value.strip()]
        if any(len(value) > 180 for value in cleaned):
            raise ValueError("Each experience highlight must be at most 180 characters")
        return cleaned


# ---------------------------------------------------------------------------
# Skills
# ---------------------------------------------------------------------------
class SkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    sort_order: int
    used_in: list[str] = Field(default_factory=list)


class SkillCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    category_id: int
    sort_order: int = 0
    used_in: list[str] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return _require_text(value)


class SkillUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    category_id: int | None = None
    sort_order: int | None = None
    used_in: list[str] | None = None


class SkillCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    sort_order: int
    skills: list[SkillOut] = []


class SkillCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    sort_order: int = 0

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return _require_text(value)


class SkillCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    sort_order: int | None = None


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------
class ProjectBase(BaseModel):
    slug: str = Field(..., max_length=120)
    title: str = Field(..., max_length=160)
    summary: str = ""
    description: str = ""
    tech_stack: list[str] = Field(default_factory=list)
    github_url: str = Field(default="", max_length=255)
    live_url: str = Field(default="", max_length=255)
    dashboard_key: str = Field(default="none", max_length=40)
    cover_note: str = Field(default="", max_length=255)
    featured: bool = True
    sort_order: int = 0

    @field_validator("github_url", "live_url")
    @classmethod
    def validate_external_urls(cls, value: str) -> str:
        return _validate_external_url(value)


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# The "must not be blank" rules live on the create models rather than on the
# shared base, because the *Out models read from the base too: a row that an
# earlier build already stored with an empty name would otherwise fail
# response validation and take the whole public page down with a 500.
class ProjectCreate(ProjectBase):
    slug: str = Field(..., min_length=1, max_length=120)
    title: str = Field(..., min_length=1, max_length=160)

    @field_validator("slug", "title")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        return _require_text(value)


class ProjectUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=120)
    title: str | None = Field(default=None, min_length=1, max_length=160)
    summary: str | None = None
    description: str | None = None
    tech_stack: list[str] | None = None
    github_url: str | None = Field(default=None, max_length=255)
    live_url: str | None = Field(default=None, max_length=255)
    dashboard_key: str | None = Field(default=None, max_length=40)
    cover_note: str | None = Field(default=None, max_length=255)
    featured: bool | None = None
    sort_order: int | None = None

    @field_validator("github_url", "live_url")
    @classmethod
    def validate_external_urls(cls, value: str | None) -> str | None:
        return _validate_external_url(value) if value is not None else value


# ---------------------------------------------------------------------------
# Education
# ---------------------------------------------------------------------------
class EducationBase(BaseModel):
    institution: str = Field(..., max_length=200)
    degree: str = Field(..., max_length=160)
    field: str = Field(default="", max_length=160)
    location: str = Field(default="", max_length=120)
    start_year: str = Field(default="", max_length=10)
    end_year: str = Field(default="", max_length=10)
    score: str = Field(default="", max_length=40)
    sort_order: int = 0


class EducationOut(EducationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class EducationCreate(EducationBase):
    institution: str = Field(..., min_length=1, max_length=200)
    degree: str = Field(..., min_length=1, max_length=160)

    @field_validator("institution", "degree")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        return _require_text(value)


class EducationUpdate(BaseModel):
    institution: str | None = Field(default=None, min_length=1, max_length=200)
    degree: str | None = Field(default=None, min_length=1, max_length=160)
    field: str | None = Field(default=None, max_length=160)
    location: str | None = Field(default=None, max_length=120)
    start_year: str | None = Field(default=None, max_length=10)
    end_year: str | None = Field(default=None, max_length=10)
    score: str | None = Field(default=None, max_length=40)
    sort_order: int | None = None


# ---------------------------------------------------------------------------
# Certificates
# ---------------------------------------------------------------------------
class CertificateBase(BaseModel):
    name: str = Field(..., max_length=200)
    issuer: str = Field(default="", max_length=160)
    issued_on: str = Field(default="", max_length=40)
    url: str = Field(default="", max_length=255)
    image_url: str = Field(default="", max_length=255)
    sort_order: int = 0

    @field_validator("url")
    @classmethod
    def validate_external_url(cls, value: str) -> str:
        return _validate_external_url(value)

    @field_validator("image_url")
    @classmethod
    def validate_image_path(cls, value: str) -> str:
        return _validate_certificate_image_path(value)


class CertificateOut(CertificateBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class CertificateCreate(CertificateBase):
    name: str = Field(..., min_length=1, max_length=200)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return _require_text(value)


class CertificateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    issuer: str | None = Field(default=None, max_length=160)
    issued_on: str | None = Field(default=None, max_length=40)
    url: str | None = Field(default=None, max_length=255)
    image_url: str | None = Field(default=None, max_length=255)
    sort_order: int | None = None

    @field_validator("url")
    @classmethod
    def validate_external_url(cls, value: str | None) -> str | None:
        return _validate_external_url(value) if value is not None else value

    @field_validator("image_url")
    @classmethod
    def validate_image_path(cls, value: str | None) -> str | None:
        return _validate_certificate_image_path(value) if value is not None else value


# ---------------------------------------------------------------------------
# Languages
# ---------------------------------------------------------------------------
class LanguageBase(BaseModel):
    name: str = Field(..., max_length=80)
    proficiency: str = Field(default="", max_length=80)
    sort_order: int = 0


class LanguageOut(LanguageBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class LanguageCreate(LanguageBase):
    name: str = Field(..., min_length=1, max_length=80)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return _require_text(value)


class LanguageUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    proficiency: str | None = Field(default=None, max_length=80)
    sort_order: int | None = None


# ---------------------------------------------------------------------------
# Aggregate (single call for the public homepage)
# ---------------------------------------------------------------------------
class PortfolioOut(BaseModel):
    profile: ProfileOut
    experiences: list[ExperienceOut]
    skill_categories: list[SkillCategoryOut]
    projects: list[ProjectOut]
    education: list[EducationOut]
    certificates: list[CertificateOut]
    languages: list[LanguageOut]


class PortfolioRevisionOut(BaseModel):
    """A tiny durable marker used for conditional public-page refreshes."""

    revision: str


# ---------------------------------------------------------------------------
# Lumpy Skin Disease dashboard
# ---------------------------------------------------------------------------
class BoundingBox(BaseModel):
    x: float  # 0-1, normalized top-left x
    y: float  # 0-1, normalized top-left y
    width: float  # 0-1, normalized
    height: float  # 0-1, normalized
    label: str
    confidence: float


class DetectionResult(BaseModel):
    result: str  # "positive" | "negative"
    confidence: float
    boxes: list[BoundingBox]
    is_demo: bool
    note: str = ""


class DetectionLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    result: str
    confidence: float
    is_demo: bool
    created_at: datetime


class LumpyStatsOut(BaseModel):
    # `model_loaded` is a public API field, not a Pydantic internal model
    # namespace; declaring this removes the warning without changing payloads.
    model_config = ConfigDict(protected_namespaces=())

    total_scans: int
    positive_count: int
    negative_count: int
    positive_rate: float
    model_loaded: bool
    recent: list[DetectionLogOut]


# ---------------------------------------------------------------------------
# JanSeva Connect dashboard
# ---------------------------------------------------------------------------
class ServiceRequestCreate(BaseModel):
    # These three were declared wider than their columns (160/80/120), which
    # a visitor could exceed from the public demo form for a 500 on Postgres.
    citizen_name: str = Field(..., min_length=1, max_length=160)
    category: str = Field(..., min_length=1, max_length=80)
    village: str = Field(default="", max_length=120)
    description: str = Field(default="", max_length=2000)
    language: str = Field(default="en", max_length=10)


class ServiceRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    reference_code: str
    citizen_name: str
    category: str
    village: str
    description: str
    language: str
    status: str
    created_at: datetime


class ServiceRequestStatusUpdate(BaseModel):
    status: str


class ChatMessageIn(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    language: str = "auto"


class ChatMessageOut(BaseModel):
    reply: str
    detected_language: str
    is_demo: bool
