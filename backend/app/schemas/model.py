from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TunedModelRead(BaseModel):
    id: int
    user_id: int
    job_id: int
    name: str
    base_model: str
    s3_key: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TunedModelCreate(BaseModel):
    job_id: int
    name: str
    base_model: str
    s3_key: str
