import os
import time
from datetime import datetime, timezone

from sqlmodel import Field, Session, SQLModel, create_engine
from worker import app

# Minimal SQLModel definition just for the worker
class FineTuningJob(SQLModel, table=True):
    __tablename__ = "finetuningjob"
    id: int = Field(primary_key=True)
    status: str
    error_message: str | None = None
    completed_at: datetime | None = None

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://selftune:selftune_dev_password@postgres:5432/selftune"
)
engine = create_engine(DATABASE_URL)

@app.task(bind=True, max_retries=1)
def train_model_task(self, job_id: int):
    """
    Mock training job. Sleeps for a few seconds and marks the job as success.
    """
    print(f"Mock Finetune Worker: Received job {job_id}. Pretending to train...")
    
    with Session(engine) as session:
        job = session.get(FineTuningJob, job_id)
        if not job:
            return

        job.status = "training"
        session.add(job)
        session.commit()
        
        # Simulate loading model and training
        time.sleep(15) 

        job.status = "success"
        job.completed_at = datetime.now(timezone.utc)
        session.add(job)
        session.commit()
        
    print(f"Mock Finetune Worker: Job {job_id} successfully completed.")
