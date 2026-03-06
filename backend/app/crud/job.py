from sqlmodel import Session, select

from app.models.job import FineTuningJob


def create_job(
    session: Session,
    user_id: int,
    dataset_id: int,
    base_model: str,
    learning_rate: float,
    num_epochs: int,
) -> FineTuningJob:
    job = FineTuningJob(
        user_id=user_id,
        dataset_id=dataset_id,
        base_model=base_model,
        learning_rate=learning_rate,
        num_epochs=num_epochs,
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    return job


def get_job(session: Session, job_id: int, user_id: int) -> FineTuningJob | None:
    statement = select(FineTuningJob).where(FineTuningJob.id == job_id, FineTuningJob.user_id == user_id)
    return session.exec(statement).first()


def get_jobs_for_user(session: Session, user_id: int) -> list[FineTuningJob]:
    statement = select(FineTuningJob).where(FineTuningJob.user_id == user_id).order_by(FineTuningJob.created_at.desc())
    return list(session.exec(statement).all())
