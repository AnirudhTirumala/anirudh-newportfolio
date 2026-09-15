"""
Central application settings.

Everything here is overridable through environment variables (or a `.env`
file next to this project — see `.env.example`). Nothing sensitive is
hardcoded: the admin account is created from ADMIN_USERNAME / ADMIN_PASSWORD
the first time the app boots, and the JWT SECRET_KEY must be set before you
deploy anywhere public.

SECRET_KEY and ADMIN_PASSWORD intentionally have NO real default value in
this file. Earlier versions of this file shipped literal fallback strings
("dev-only-secret-change-me", "change-this-password") — that's a real
security hole: since this source is public, anyone could sign their own
valid admin JWT or just log in with the known password if an operator
forgot to set real values. The validator below fails startup outright in
production, and generates a random one-time value for local dev so nothing
insecure is ever silently in effect.
"""

import secrets
import sys
from functools import lru_cache
from typing import Optional

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Auth -----------------------------------------------------------
    # Left blank on purpose - see module docstring. Set via env/.env in any
    # real deployment. _enforce_secrets() below fills in a safe value.
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Bootstrap admin account. Read once at startup to create the single
    # admin user if the admin_users table is empty. Change the password by
    # updating this env var and restarting only works before the account
    # exists — afterwards, change it via the database or a future
    # "change password" endpoint.
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = ""

    # --- Database ---------------------------------------------------------
    # SQLite by default (zero config, ships in the repo as portfolio.db).
    # Point this at a managed Postgres URL in production, e.g.
    # postgresql+psycopg://user:pass@host:5432/dbname
    DATABASE_URL: str = "sqlite:///./portfolio.db"

    # --- CORS ---------------------------------------------------------
    # Comma-separated list of origins allowed to call this API.
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # --- Uploads ---------------------------------------------------------
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 8

    # --- Lumpy Skin Disease Detection dashboard ---------------------------
    # Path to a trained Ultralytics YOLO .pt file. Leave unset to serve the
    # dashboard in demo mode (curated sample detections, no model required).
    LUMPY_MODEL_PATH: Optional[str] = None
    LUMPY_CONFIDENCE_THRESHOLD: float = 0.35

    # --- JanSeva Connect multilingual assistant ---------------------------
    # Leave LLM_API_KEY unset to run the assistant in rule-based demo mode.
    # Any OpenAI-compatible Chat Completions endpoint works here; defaults
    # point at xAI's Grok API since that's what JanSeva Connect used.
    # Model names move fast - check https://docs.x.ai/developers/models
    # before relying on the default below.
    LLM_API_KEY: Optional[str] = None
    LLM_API_BASE: str = "https://api.x.ai/v1"
    LLM_MODEL: str = "grok-4.6"

    ENVIRONMENT: str = "development"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @model_validator(mode="after")
    def _enforce_secrets(self) -> "Settings":
        """Refuse to run with a guessable admin credential or JWT key.

        In production, a missing SECRET_KEY or ADMIN_PASSWORD is a hard
        startup error rather than a silent fallback - "it booted" should
        never mean "it booted insecurely". In development, we generate a
        random per-process value so `uvicorn app.main:app` still works with
        zero config, but that value is never a fixed string an attacker
        could read from this source file.
        """
        is_prod = self.ENVIRONMENT.lower() == "production"
        origins = self.cors_origins_list

        if "*" in origins:
            raise RuntimeError("CORS_ORIGINS must name explicit origins when credentialed requests are enabled.")
        if is_prod and not origins:
            raise RuntimeError("Refusing to start: CORS_ORIGINS must include the deployed frontend origin in production.")

        if not self.SECRET_KEY:
            if is_prod:
                raise RuntimeError(
                    "Refusing to start: SECRET_KEY is not set. Generate one with "
                    "`python3 -c \"import secrets; print(secrets.token_hex(32))\"` and set it "
                    "as the SECRET_KEY environment variable before running in production."
                )
            object.__setattr__(self, "SECRET_KEY", secrets.token_hex(32))
            print(
                "[config] SECRET_KEY not set - generated a random ephemeral key for this "
                "process. Existing login sessions will not survive a restart. Set SECRET_KEY "
                "in your environment for stable sessions.",
                file=sys.stderr,
            )

        if not self.ADMIN_PASSWORD:
            if is_prod:
                raise RuntimeError(
                    "Refusing to start: ADMIN_PASSWORD is not set. Set a strong ADMIN_PASSWORD "
                    "environment variable before the first run so the admin account isn't "
                    "created with a guessable password."
                )
            generated = secrets.token_urlsafe(12)
            object.__setattr__(self, "ADMIN_PASSWORD", generated)
            print(
                f"[config] ADMIN_PASSWORD not set - generated a one-time password for the "
                f"'{self.ADMIN_USERNAME}' admin account: {generated}\n"
                f"         This only applies the first time the app boots with an empty "
                f"database. Save it now, or set ADMIN_PASSWORD yourself and restart before "
                f"logging in for the first time.",
                file=sys.stderr,
            )

        if len(self.SECRET_KEY) < 32 and is_prod:
            raise RuntimeError(
                "Refusing to start: SECRET_KEY is too short for production use (need at "
                "least 32 characters of randomness)."
            )

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
