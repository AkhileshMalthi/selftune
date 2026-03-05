from sqlmodel import SQLModel, create_engine

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    # SQLite-specific: allow use across threads (needed for FastAPI's threadpool)
    connect_args={"check_same_thread": False}
    if settings.DATABASE_URL.startswith("sqlite")
    else {},
)


def create_db_and_tables() -> None:
    """Create all tables defined under SQLModel metadata."""
    SQLModel.metadata.create_all(engine)
