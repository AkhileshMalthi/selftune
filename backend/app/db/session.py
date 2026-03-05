from collections.abc import Generator

from sqlmodel import Session

from app.db.base import engine


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a SQLModel session."""
    with Session(engine) as session:
        yield session
