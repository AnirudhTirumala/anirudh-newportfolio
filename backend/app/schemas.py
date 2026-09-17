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
class ProfileBase(BaseModel):
    name: str = ""
    title: str = ""
    tagline: str = ""
    bio: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    github_url: str = ""
    linkedin_url: str = ""
    resume_url: str = ""

    @field_validator("github_url", "linkedin_url", "resume_url")
    @classmethod
    def validate_external_urls(cls, value: str) -> str:
        return _validate_external_url(value)


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
    name: str
    category_id: int
    sort_order: int = 0
    used_in: list[str] = Field(default_factory=list)


class SkillUpdate(BaseModel):
    name: str | None = None
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
    name: str
    sort_order: int = 0


class SkillCategoryUpdate(BaseModel):
    name: str | None = None
    sort_order: int | None = None


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------
class ProjectBase(BaseModel):
    slug: str
    title: str
    summary: str = ""
    description: str = ""
    tech_stack: list[str] = Field(default_factory=list)
    github_url: str = ""
    live_url: str = ""
    dashboard_key: str = "none"
    cover_note: str = ""
    featured: bool = True
    sort_order: int = 0

    @field_validator("github_url", "live_url")
    @classmethod
    def validate_external_urls(cls, value: str) -> str:
        return _validate_external_url(value)


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    slug: str | None = None
    title: str | None = None
    summary: str | None = None
    description: str | None = None
    tech_stack: list[str] | None = None
    github_url: str | None = None
    live_url: str | None = None
    dashboard_key: str | None = None
    cover_note: str | None = None
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
    institution: str
    degree: str
    field: str = ""
    location: str = ""
    start_year: str = ""
    end_year: str = ""
    score: str = ""
    sort_order: int = 0


class EducationOut(EducationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class EducationCreate(EducationBase):
    pass


class EducationUpdate(BaseModel):
    institution: str | None = None
    degree: str | None = None
    field: str | None = None
    location: str | None = None
    start_year: str | None = None
    end_year: str | None = None
    score: str | None = None
    sort_order: int | None = None


# ---------------------------------------------------------------------------
# Certificates
# ---------------------------------------------------------------------------
class CertificateBase(BaseModel):
    name: str
    issuer: str = ""
    issued_on: str = ""
    url: str = ""
    image_url: str = ""
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
    pass


class CertificateUpdate(BaseModel):
    name: str | None = None
    issuer: str | None = None
    issued_on: str | None = None
    url: str | None = None
    image_url: str | None = None
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
    name: str
    proficiency: str = ""
    sort_order: int = 0


class LanguageOut(LanguageBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class LanguageCreate(LanguageBase):
    pass


class LanguageUpdate(BaseModel):
    name: str | None = None
    proficiency: str | None = None
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
    citizen_name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    village: str = Field(default="", max_length=200)
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
