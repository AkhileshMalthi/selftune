from datetime import datetime

from pydantic import BaseModel, ConfigDict


class JobCreate(BaseModel):
    dataset_id: int
    base_model: str
    learning_rate: float = 2e-4
    num_epochs: int = 3


class JobRead(BaseModel):
    id: int
    user_id: int
    dataset_id: int
    base_model: str
    learning_rate: float
    num_epochs: int
    status: str
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
