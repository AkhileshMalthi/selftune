"""
Pytest configuration for the selftune backend test suite.

Uses an in-memory SQLite database and FastAPI's TestClient so tests
are fully isolated from the dev database.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

import app.models  # noqa: F401 — registers all SQLModel tables with metadata
from app.db.session import get_session
from app.main import app as fastapi_app

# ---------------------------------------------------------------------------
# In-memory DB fixture — shared within a test session, rolled back per test
# ---------------------------------------------------------------------------


@pytest.fixture(name="session", scope="function")
def session_fixture():
    """Yield a fresh in-memory SQLite session for each test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="client", scope="function")
def client_fixture(session: Session):
    """TestClient wired to the in-memory session."""

    def override_get_session():
        yield session

    fastapi_app.dependency_overrides[get_session] = override_get_session
    with TestClient(fastapi_app, raise_server_exceptions=True) as c:
        yield c
    fastapi_app.dependency_overrides.clear()
