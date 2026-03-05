# selftune — Backend

FastAPI backend for the selftune self-service LLM fine-tuning platform.

> **Status**: In progress. JWT authentication is implemented.
> Remaining features (fine-tuning jobs, datasets, model management) are planned.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI |
| ORM | SQLModel (SQLAlchemy + Pydantic) |
| Database | PostgreSQL (SQLite for local dev) |
| Password hashing | pwdlib · Argon2 |
| Auth tokens | PyJWT · HS256 |
| Package manager | uv |

## Project Structure

```
app/
├── api/
│   ├── deps.py          # get_current_user dependency
│   ├── main.py          # root API router
│   └── routes/
│       ├── auth.py      # register · login · refresh · me
│       └── health.py
├── core/
│   ├── config.py        # pydantic-settings (env-driven)
│   └── security.py      # hashing + JWT helpers
├── crud/
│   └── user.py
├── db/
│   ├── base.py          # engine + create_db_and_tables()
│   └── session.py       # get_session() dependency
├── models/
│   └── user.py          # SQLModel table
└── schemas/
    └── user.py          # request/response schemas
tests/
└── test_auth.py         # 19 isolated endpoint tests
```

## Implemented Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/api/v1/health` | — | Health check |
| `POST` | `/api/v1/auth/register` | — | Create account |
| `POST` | `/api/v1/auth/login` | — | OAuth2 form → `access_token` + `refresh_token` |
| `POST` | `/api/v1/auth/refresh` | — | Swap refresh token for a new token pair |
| `GET`  | `/api/v1/auth/me` | Bearer | Current user |

Interactive docs: `http://localhost:8000/api/v1/docs`

## Getting Started

### Prerequisites

- [uv](https://docs.astral.sh/uv/) — `pip install uv`
- Python 3.12+

### Local Setup

```bash
uv sync
cp .env.example .env   # fill in SECRET_KEY at minimum
uv run uvicorn app.main:app --reload
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | **required** | JWT signing secret — generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_URL` | `sqlite:///./selftune.db` | SQLAlchemy connection string |
| `POSTGRES_PASSWORD` | — | Required when using Postgres |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |

## Running Tests

```bash
uv run pytest tests/ -v
```

Tests use an in-memory SQLite database and FastAPI's `TestClient` — no running server or external DB needed.

## Docker

```bash
# From the repo root
docker compose up --build
```

The backend waits for Postgres to pass its health check before starting.

## Development Tasks (Justfile)

```bash
just install   # uv sync
just test      # pytest
just lint      # ruff check + ruff format
```
