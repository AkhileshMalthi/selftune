from datetime import datetime, timezone
from typing import Annotated

from sqlmodel import Field, SQLModel


class FineTuningJob(SQLModel, table=True):
    """Tracks a fine-tuning job sent to the ML worker."""

    __tablename__ = "fine_tuning_jobs"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    dataset_id: int = Field(foreign_key="datasets.id", index=True)
    
    # Configuration
    base_model: str = Field(description="Hugging Face model ID, e.g., HuggingFaceTB/SmolLM-135M")
    learning_rate: float = Field(default=2e-4)
    num_epochs: int = Field(default=3)
    
    # State
    status: Annotated[
        str,
        Field(
            default="queued",
            description="queued | running | completed | failed",
        ),
    ]
    error_message: str | None = Field(default=None)
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = Field(default=None)
