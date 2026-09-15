import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, selectinload

from . import models, schemas
from .config import settings
from .database import Base, SessionLocal, engine, ensure_schema_upgrades, get_db
from .routers import auth, content, experiences, janseva, lumpy, profile, projects, skills
from .seed_data import run_all_seeds

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_schema_upgrades()
    db = SessionLocal()
    try:
        run_all_seeds(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Anirudh Tirumala — Portfolio API",
    description="Backend for a personal portfolio site: content CRUD behind admin auth, plus the "
    "JanSeva Connect and Lumpy Skin Disease Detection project dashboards.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.ENVIRONMENT.lower() == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(experiences.router)
app.include_router(skills.router)
app.include_router(projects.router)
app.include_router(content.router)
app.include_router(lumpy.router)
app.include_router(janseva.router)


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/portfolio", response_model=schemas.PortfolioOut, tags=["meta"])
def get_portfolio(db: Session = Depends(get_db)) -> schemas.PortfolioOut:
    """Everything the public homepage needs, in a single call."""
    profile_row = db.get(models.Profile, 1)
    if not profile_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio content is not set up yet")

    categories = (
        db.query(models.SkillCategory)
        .options(selectinload(models.SkillCategory.skills))
        .order_by(models.SkillCategory.sort_order)
        .all()
    )
    project_rows = db.query(models.Project).order_by(models.Project.sort_order).all()
    education_rows = db.query(models.Education).order_by(models.Education.sort_order).all()
    certificate_rows = db.query(models.Certificate).order_by(models.Certificate.sort_order).all()
    language_rows = db.query(models.Language).order_by(models.Language.sort_order).all()

    return schemas.PortfolioOut(
        profile=schemas.ProfileOut.model_validate(profile_row),
        experiences=[schemas.ExperienceOut.model_validate(entry) for entry in db.query(models.Experience).order_by(models.Experience.sort_order, models.Experience.id).all()],
        skill_categories=[schemas.SkillCategoryOut.model_validate(c) for c in categories],
        projects=[schemas.ProjectOut.model_validate(p) for p in project_rows],
        education=[schemas.EducationOut.model_validate(e) for e in education_rows],
        certificates=[schemas.CertificateOut.model_validate(c) for c in certificate_rows],
        languages=[schemas.LanguageOut.model_validate(l) for l in language_rows],
    )
