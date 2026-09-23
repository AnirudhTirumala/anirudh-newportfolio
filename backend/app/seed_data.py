"""
Populates an empty database with the content from Anirudh's resume, and
creates the single admin account. Everything here is a *starting point* -
once the admin panel is used to edit content, this seed data is never
re-applied (each seed function checks the table is empty before writing).
"""

import sys

from sqlalchemy.orm import Session

from . import models
from .config import settings
from .security import hash_password


def seed_admin(db: Session) -> None:
    existing = db.query(models.AdminUser).first()
    if existing:
        # Editing ADMIN_USERNAME/ADMIN_PASSWORD after the account exists has
        # no effect (see config.py), and silently ignoring the new value
        # looks exactly like a broken login from the outside. Say so in the
        # boot log, which is the only place the owner can find out why the
        # credential they just set in the Render dashboard is rejected.
        if existing.username != settings.ADMIN_USERNAME:
            print(
                f"[seed] ADMIN_USERNAME is set to '{settings.ADMIN_USERNAME}' but the existing admin "
                f"account is '{existing.username}'. The env var is only read when the account is "
                f"first created - log in as '{existing.username}', or change the row in the database.",
                file=sys.stderr,
            )
        return
    admin = models.AdminUser(
        username=settings.ADMIN_USERNAME,
        hashed_password=hash_password(settings.ADMIN_PASSWORD),
    )
    db.add(admin)
    db.commit()


def seed_profile(db: Session) -> None:
    if db.query(models.Profile).count() > 0:
        return
    profile = models.Profile(
        id=1,
        name="Anirudh Tirumala",
        title="AI Engineer",
        tagline="I build systems that see, understand, and respond.",
        bio=(
            "I'm Anirudh Tirumala, an AI engineer based in Kakinada, India. "
            "I build applied machine learning systems end to end - from a "
            "YOLO model that spots disease in cattle before it spreads, to "
            "an LLM-powered assistant that helps citizens navigate local "
            "government in their own language. I work comfortably across "
            "the stack: PyTorch and OpenCV on one side, FastAPI and React "
            "on the other, with a fair amount of RAG and agentic tooling "
            "in between. I'm currently an AI Engineer Intern at Sphere "
            "Global in Hyderabad, annotating image datasets, generating "
            "synthetic damage data with LLMs and generative AI, and training "
            "YOLO detection models."
        ),
        email="anirudhtirumala@gmail.com",
        phone="+91 6309279111",
        location="Kakinada, India",
        github_url="https://github.com/AnirudhTirumala",
        linkedin_url="https://linkedin.com/in/anirudhtirumala",
        resume_url="",
    )
    db.add(profile)
    db.commit()


def seed_experiences(db: Session) -> None:
    if db.query(models.Experience).count() > 0:
        return
    db.add(
        models.Experience(
            company="Sphere Global",
            role="AI Engineer Intern",
            location="Hyderabad, India",
            current=True,
            description=(
                "Annotating image datasets and generating synthetic damage data with LLMs and "
                "generative AI, then using YOLO to train detection models for visual-damage detection."
            ),
            highlights=[
                "Image annotation",
                "Synthetic damage data with LLMs & GenAI",
                "YOLO detection-model training",
            ],
            sort_order=0,
        )
    )
    db.commit()


JANSEVA = "JanSeva Connect"
LUMPY = "Lumpy Skin Disease Detection AI"
SPHERE_GLOBAL = "Sphere Global — AI Engineer Intern"
BOTH = [JANSEVA, LUMPY]


def seed_skills(db: Session) -> None:
    if db.query(models.SkillCategory).count() > 0:
        return
    # Each skill is (name, used_in) - used_in holds project titles (matched
    # against Project.title on the frontend to become a link) or a short
    # freeform note. Left empty for skills not tied to either featured
    # project yet; edit from the admin panel any time.
    categories = [
        (
            "Programming",
            [
                ("Python", BOTH),
                ("C", ["Coursework"]),
                ("Java (Basic)", ["Coursework"]),
                ("SQL", BOTH),
            ],
        ),
        (
            "AI & Machine Learning",
            [
                ("Machine Learning", [LUMPY]),
                ("Deep Learning", [LUMPY]),
                ("Computer Vision", [LUMPY]),
                ("YOLO", [LUMPY, SPHERE_GLOBAL]),
                ("PyTorch", [LUMPY]),
                ("OpenCV", [LUMPY]),
                ("Data Preprocessing", [LUMPY]),
                ("EDA", [LUMPY]),
                ("Data Annotation", [LUMPY, SPHERE_GLOBAL]),
                ("Synthetic Data Generation", [SPHERE_GLOBAL]),
            ],
        ),
        (
            "Generative AI",
            [
                ("LLMs", [JANSEVA, SPHERE_GLOBAL]),
                ("Generative AI", [JANSEVA, SPHERE_GLOBAL]),
                ("RAG", [JANSEVA]),
                ("LangChain", [JANSEVA]),
                ("LangGraph", [JANSEVA]),
                ("Agentic AI", [JANSEVA]),
                ("Prompt Engineering", [JANSEVA]),
            ],
        ),
        (
            "Backend & APIs",
            [
                ("FastAPI", [JANSEVA]),
                ("Flask", [LUMPY]),
                ("REST API Development", BOTH),
                ("API Integration", [JANSEVA]),
            ],
        ),
        (
            "Frontend",
            [
                ("React", BOTH),
                ("Next.js", [LUMPY]),
                ("TypeScript", BOTH),
                ("JavaScript", [JANSEVA]),
                ("HTML", BOTH),
                ("CSS", BOTH),
                ("Tailwind CSS", BOTH),
            ],
        ),
        (
            "Databases",
            [
                ("PostgreSQL", [JANSEVA]),
                ("MySQL", ["Coursework"]),
            ],
        ),
        (
            "Tools",
            [
                ("Git", BOTH),
                ("GitHub", BOTH),
                ("Jupyter Notebook", [LUMPY]),
                ("VS Code", BOTH),
                ("Android SDK", ["Coursework"]),
            ],
        ),
        (
            "CS Fundamentals",
            [
                ("OOP", ["Coursework", *BOTH]),
                ("Data Structures", ["Coursework"]),
                ("SDLC", BOTH),
                ("Debugging", BOTH),
                ("Agile Methodologies", ["Coursework"]),
            ],
        ),
    ]
    for cat_order, (cat_name, skills) in enumerate(categories):
        category = models.SkillCategory(name=cat_name, sort_order=cat_order)
        db.add(category)
        db.flush()
        for skill_order, (skill_name, used_in) in enumerate(skills):
            db.add(models.Skill(name=skill_name, sort_order=skill_order, category_id=category.id, used_in=used_in))
    db.commit()


def seed_projects(db: Session) -> None:
    if db.query(models.Project).count() > 0:
        return
    projects = [
        models.Project(
            slug="janseva-connect",
            title=JANSEVA,
            summary="An AI-powered Gram Panchayat portal that connects citizens and local government through one web app.",
            description=(
                "A full-stack Gram Panchayat management portal with secure, role-based access and "
                "digital citizen services. An AI assistant built on the Grok API gives multilingual, "
                "context-aware answers so residents can navigate local government without needing to "
                "know how the bureaucracy behind it works. The backend exposes scalable REST APIs over "
                "PostgreSQL; the frontend is a responsive React and TypeScript dashboard for both "
                "citizens and Panchayat staff."
            ),
            tech_stack=[
                "Python",
                "FastAPI",
                "PostgreSQL",
                "React",
                "TypeScript",
                "Tailwind CSS",
                "JavaScript",
                "Grok API",
            ],
            github_url="",
            live_url="",
            dashboard_key="janseva",
            cover_note="Citizen services, connected",
            featured=True,
            sort_order=0,
        ),
        models.Project(
            slug="lumpy-skin-disease-detection",
            title=LUMPY,
            summary="A YOLO-based computer vision app that flags Lumpy Skin Disease in cattle from a single photo.",
            description=(
                "A full-stack AI application for detecting Lumpy Skin Disease (LSD) in cattle. A YOLO "
                "(Ultralytics) model trained for real-time disease detection runs behind a Flask "
                "inference API, so a photo taken in the field can return a diagnosis in seconds - no "
                "vet visit required to get a first read. The frontend is a Next.js and TypeScript app "
                "built for quick image upload and clear, confidence-scored results."
            ),
            tech_stack=[
                "Python",
                "Flask",
                "YOLO (Ultralytics)",
                "PyTorch",
                "OpenCV",
                "React",
                "Next.js",
                "TypeScript",
                "Tailwind CSS",
                "SQL",
            ],
            github_url="",
            live_url="",
            dashboard_key="lumpy",
            cover_note="Field diagnosis in seconds",
            featured=True,
            sort_order=1,
        ),
    ]
    db.add_all(projects)
    db.commit()


def seed_education(db: Session) -> None:
    if db.query(models.Education).count() > 0:
        return
    db.add(
        models.Education(
            institution="Koneru Lakshmaiah Education Foundation (KLEF)",
            degree="B.Tech",
            field="Computer Science Engineering",
            location="Vijayawada, India",
            start_year="2021",
            end_year="2025",
            score="CGPA 7.75",
            sort_order=0,
        )
    )
    db.commit()


def seed_certificates(db: Session) -> None:
    if db.query(models.Certificate).count() > 0:
        return
    db.add_all(
        [
            models.Certificate(name="AWS Certified Cloud Practitioner", issuer="Amazon Web Services", sort_order=0),
            models.Certificate(name="Salesforce Certified AI Associate", issuer="Salesforce", sort_order=1),
        ]
    )
    db.commit()


def seed_languages(db: Session) -> None:
    if db.query(models.Language).count() > 0:
        return
    db.add_all(
        [
            models.Language(name="English", sort_order=0),
            models.Language(name="Hindi", sort_order=1),
            models.Language(name="Telugu", sort_order=2),
        ]
    )
    db.commit()


def run_all_seeds(db: Session) -> None:
    seed_admin(db)
    seed_profile(db)
    seed_experiences(db)
    seed_skills(db)
    seed_projects(db)
    seed_education(db)
    seed_certificates(db)
    seed_languages(db)
