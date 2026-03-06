from sqlmodel import Session, select

from app.models.dataset import Dataset, DatasetValidationReport


def create_dataset(
    session: Session,
    user_id: int,
    name: str,
    s3_key: str,
    original_filename: str,
) -> Dataset:
    """Persist a new Dataset record with status 'processing'."""
    dataset = Dataset(
        user_id=user_id,
        name=name,
        s3_key=s3_key,
        original_filename=original_filename,
        status="processing",
    )
    session.add(dataset)
    session.commit()
    session.refresh(dataset)
    return dataset


def get_datasets_for_user(session: Session, user_id: int) -> list[Dataset]:
    """Return all datasets belonging to a user, newest first."""
    return list(
        session.exec(
            select(Dataset)
            .where(Dataset.user_id == user_id)
            .order_by(Dataset.created_at.desc())  # type: ignore[arg-type]
        ).all()
    )


def get_dataset(session: Session, dataset_id: int, user_id: int) -> Dataset | None:
    """Return a single dataset, scoped to the requesting user."""
    return session.exec(
        select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.user_id == user_id,
        )
    ).first()


def get_validation_report(
    session: Session, dataset_id: int
) -> DatasetValidationReport | None:
    """Return the validation report for a dataset if it exists."""
    return session.exec(
        select(DatasetValidationReport).where(
            DatasetValidationReport.dataset_id == dataset_id
        )
    ).first()
