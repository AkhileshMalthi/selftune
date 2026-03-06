from datetime import datetime, timezone
from typing import Annotated

from sqlmodel import Field, SQLModel


class Dataset(SQLModel, table=True):
    """Tracks metadata for a user-uploaded JSONL dataset stored in S3."""

    __tablename__ = "datasets"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    name: str = Field(max_length=255)
    s3_key: str = Field(description="S3 object key for the (cleaned) dataset file")
    original_filename: str = Field(max_length=255)
    status: Annotated[
        str,
        Field(
            default="processing",
            description="processing | ready | failed",
        ),
    ]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DatasetValidationReport(SQLModel, table=True):
    """Stores the output of the 4-stage Celery validation pipeline."""

    __tablename__ = "dataset_validation_reports"

    id: int | None = Field(default=None, primary_key=True)
    dataset_id: int = Field(foreign_key="datasets.id", unique=True, index=True)

    # Stage 1 — Format
    total_rows: int = Field(default=0)
    valid_rows: int = Field(default=0)
    invalid_format_count: int = Field(default=0)

    # Stage 2 — Token stats (no hard limit at upload time)
    max_tokens_per_row: int = Field(default=0)
    avg_tokens_per_row: float = Field(default=0.0)

    # Stage 3 — Duplicates
    duplicate_count: int = Field(default=0)

    # Stage 4 — Toxicity
    toxicity_score: float = Field(default=0.0)

    # Overall
    is_passed: bool = Field(default=False)
    error_message: str | None = Field(default=None)
    completed_at: datetime | None = Field(default=None)
