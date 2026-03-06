from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class TunedModel(SQLModel, table=True):
    """Tracks a completed fine-tuned adapter model stored in S3."""

    __tablename__ = "tuned_models"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    job_id: int = Field(foreign_key="fine_tuning_jobs.id", index=True, unique=True)
    
    name: str = Field(max_length=255, description="User-provided name for this tuned model")
    base_model: str = Field(description="The original Base Model used")
    s3_key: str = Field(description="S3 object key for the model artifacts (adapters)")
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
