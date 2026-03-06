from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, SessionDep
from app.crud.dataset import get_dataset
from app.crud.job import create_job, get_job, get_jobs_for_user
from app.schemas.job import JobCreate, JobRead
from app.worker.celery_app import celery_app

router = APIRouter()


@router.post("/", response_model=JobRead, status_code=status.HTTP_201_CREATED)
def launch_job(
    body: JobCreate,
    current_user: CurrentUser,
    session: SessionDep,
) -> JobRead:
    """Launch a new fine-tuning job."""
    # Ensure dataset exists and belongs to user
    dataset = get_dataset(session, body.dataset_id, current_user.id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found or does not belong to user.",
        )
    
    # Dataset must be ready (validated)
    if dataset.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset is not ready for training. Status: {dataset.status}",
        )

    job = create_job(
        session,
        user_id=current_user.id,
        dataset_id=body.dataset_id,
        base_model=body.base_model,
        learning_rate=body.learning_rate,
        num_epochs=body.num_epochs,
    )
    
    # Enqueue task in the ML worker queue
    celery_app.send_task("train_model_task", args=[job.id], queue="training")
    
    return JobRead.model_validate(job, from_attributes=True)


@router.get("/", response_model=list[JobRead])
def list_jobs(current_user: CurrentUser, session: SessionDep) -> list[JobRead]:
    """Return all jobs belonging to the authenticated user."""
    jobs = get_jobs_for_user(session, current_user.id)
    return [JobRead.model_validate(j, from_attributes=True) for j in jobs]


@router.get("/{job_id}", response_model=JobRead)
def get_job_detail(
    job_id: int, current_user: CurrentUser, session: SessionDep
) -> JobRead:
    """Return details for a single job."""
    job = get_job(session, job_id, current_user.id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return JobRead.model_validate(job, from_attributes=True)
