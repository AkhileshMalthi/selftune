from sqlmodel import Session, select

from app.models.tuned_model import TunedModel


def create_model(
    session: Session,
    user_id: int,
    job_id: int,
    name: str,
    base_model: str,
    s3_key: str,
) -> TunedModel:
    model = TunedModel(
        user_id=user_id,
        job_id=job_id,
        name=name,
        base_model=base_model,
        s3_key=s3_key,
    )
    session.add(model)
    session.commit()
    session.refresh(model)
    return model


def get_model(session: Session, model_id: int, user_id: int) -> TunedModel | None:
    statement = select(TunedModel).where(TunedModel.id == model_id, TunedModel.user_id == user_id)
    return session.exec(statement).first()


def get_models_for_user(session: Session, user_id: int) -> list[TunedModel]:
    statement = select(TunedModel).where(TunedModel.user_id == user_id).order_by(TunedModel.created_at.desc())
    return list(session.exec(statement).all())
