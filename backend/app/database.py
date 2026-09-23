import sys
from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings


def _sqlalchemy_database_url(url: str) -> str:
    """Use the psycopg 3 driver when given a standard Postgres URL.

    Render exposes its internal database URL as ``postgresql://...``. Making
    the driver explicit lets that URL work without asking an administrator to
    hand-edit the scheme, while SQLite development URLs remain unchanged.
    """
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url.removeprefix("postgres://")
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    return url


database_url = _sqlalchemy_database_url(settings.DATABASE_URL)
connect_args = {"check_same_thread": False} if settings.is_sqlite else {}

# Supabase can close idle Postgres connections. Pre-pinging and recycling the
# small pool avoids the first visitor after an idle period paying for a failed
# connection/retry, while keeping a free-tier-friendly cap on connections.
engine_options: dict[str, object] = {"connect_args": connect_args}
if not settings.is_sqlite:
    engine_options.update(pool_pre_ping=True, pool_recycle=300, pool_size=5, max_overflow=5, pool_timeout=30)

engine = create_engine(database_url, **engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Columns added to a model after its table already existed on someone's
# machine. This project has no Alembic migration chain (see the top of
# seed_data.py) - `Base.metadata.create_all()` only creates tables that are
# missing entirely, it never adds a column to a table that's already there.
# Without this, a database file created by an older version of this app
# would 500 on first read of the newly-added column.
_NEW_COLUMNS = [
    ("certificates", "image_url", "VARCHAR(255) DEFAULT ''"),
    ("skills", "used_in", "JSON DEFAULT '[]'"),
]


def ensure_schema_upgrades() -> None:
    """Add any column above that an older database is missing.

    Safe to call on every startup. The expected no-op cases - a brand-new
    database where `create_all` already built the table with the column, or
    any restart after the first - are recognised by inspecting the table
    rather than by running the ALTER and discarding whatever comes back. A
    blanket `except: pass` could not tell those apart from a migration that
    genuinely failed, and a swallowed failure ships a half-migrated schema
    where every read of that table 500s with nothing in the log to explain it.
    """
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    for table, column, ddl in _NEW_COLUMNS:
        if table not in existing_tables:
            continue
        if any(existing["name"] == column for existing in inspector.get_columns(table)):
            continue
        try:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
        except SQLAlchemyError as exc:
            # Don't take the whole service down over this - a transient lock
            # or connection drop at boot should be retried by the next
            # restart, not turned into a crash loop. But say so loudly:
            # reads of this table will fail until it succeeds.
            print(
                f"[database] ERROR: could not add the missing column {table}.{column}. "
                f"Reads of {table} will fail until this migration succeeds: {exc}",
                file=sys.stderr,
            )
