from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AdminUser(Base):
    """The single portfolio owner account. There is only ever one of these."""

    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class Profile(Base):
    """Singleton row (id is always 1) holding the hero / about / contact copy."""

    __tablename__ = "profile"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    title: Mapped[str] = mapped_column(String(160), default="")
    tagline: Mapped[str] = mapped_column(Text, default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    email: Mapped[str] = mapped_column(String(160), default="")
    phone: Mapped[str] = mapped_column(String(40), default="")
    location: Mapped[str] = mapped_column(String(120), default="")
    github_url: Mapped[str] = mapped_column(String(255), default="")
    linkedin_url: Mapped[str] = mapped_column(String(255), default="")
    resume_url: Mapped[str] = mapped_column(String(255), default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


class Experience(Base):
    """A role shown in the public experience timeline and managed by admin."""

    __tablename__ = "experiences"

    id: Mapped[int] = mapped_column(primary_key=True)
    company: Mapped[str] = mapped_column(String(160))
    role: Mapped[str] = mapped_column(String(160))
    location: Mapped[str] = mapped_column(String(160), default="")
    start_date: Mapped[str] = mapped_column(String(60), default="")
    end_date: Mapped[str] = mapped_column(String(60), default="")
    current: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[str] = mapped_column(Text, default="")
    highlights: Mapped[list[str]] = mapped_column(JSON, default=list)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class SkillCategory(Base):
    __tablename__ = "skill_categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    skills: Mapped[list["Skill"]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan",
        order_by="Skill.sort_order",
    )


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    category_id: Mapped[int] = mapped_column(ForeignKey("skill_categories.id"))
    # Project titles (or short freeform context, e.g. "Coursework") this
    # skill was applied in. Titles that match a Project.title exactly render
    # as a link on the public site; anything else renders as plain text.
    used_in: Mapped[list[str]] = mapped_column(JSON, default=list)

    category: Mapped["SkillCategory"] = relationship(back_populates="skills")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(160))
    summary: Mapped[str] = mapped_column(Text, default="")
    description: Mapped[str] = mapped_column(Text, default="")
    tech_stack: Mapped[list[str]] = mapped_column(JSON, default=list)
    github_url: Mapped[str] = mapped_column(String(255), default="")
    live_url: Mapped[str] = mapped_column(String(255), default="")
    # "lumpy" | "janseva" | "none" - which interactive dashboard (if any)
    # renders on this project's detail page.
    dashboard_key: Mapped[str] = mapped_column(String(40), default="none")
    cover_note: Mapped[str] = mapped_column(String(255), default="")
    featured: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Education(Base):
    __tablename__ = "education"

    id: Mapped[int] = mapped_column(primary_key=True)
    institution: Mapped[str] = mapped_column(String(200))
    degree: Mapped[str] = mapped_column(String(160))
    field: Mapped[str] = mapped_column(String(160), default="")
    location: Mapped[str] = mapped_column(String(120), default="")
    start_year: Mapped[str] = mapped_column(String(10), default="")
    end_year: Mapped[str] = mapped_column(String(10), default="")
    score: Mapped[str] = mapped_column(String(40), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Certificate(Base):
    __tablename__ = "certificates"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    issuer: Mapped[str] = mapped_column(String(160), default="")
    issued_on: Mapped[str] = mapped_column(String(40), default="")
    url: Mapped[str] = mapped_column(String(255), default="")
    # Path (under /uploads) to an admin-uploaded photo of the physical/PDF
    # certificate, shown in an on-site lightbox. Independent of `url`, which
    # is for an external verification link - a certificate can have either,
    # both, or neither.
    image_url: Mapped[str] = mapped_column(String(255), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Language(Base):
    __tablename__ = "languages"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    proficiency: Mapped[str] = mapped_column(String(80), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class DetectionLog(Base):
    """One row per Lumpy Skin Disease dashboard scan, real or demo."""

    __tablename__ = "detection_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    filename: Mapped[str] = mapped_column(String(255), default="")
    result: Mapped[str] = mapped_column(String(20), default="")  # "positive" | "negative"
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class ServiceRequest(Base):
    """A citizen service request submitted through the JanSeva Connect demo."""

    __tablename__ = "service_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    citizen_name: Mapped[str] = mapped_column(String(160))
    category: Mapped[str] = mapped_column(String(80))
    village: Mapped[str] = mapped_column(String(120), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    language: Mapped[str] = mapped_column(String(20), default="en")
    status: Mapped[str] = mapped_column(String(20), default="submitted")  # submitted | in_review | resolved
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
