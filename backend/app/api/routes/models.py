from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, SessionDep
from app.crud.model import get_model, get_models_for_user
from app.schemas.model import TunedModelRead

router = APIRouter()


@router.get("/", response_model=list[TunedModelRead])
def list_models(current_user: CurrentUser, session: SessionDep) -> list[TunedModelRead]:
    """Return all models belonging to the authenticated user."""
    models = get_models_for_user(session, current_user.id)
    return [TunedModelRead.model_validate(m, from_attributes=True) for m in models]


@router.get("/{model_id}", response_model=TunedModelRead)
def get_model_detail(
    model_id: int, current_user: CurrentUser, session: SessionDep
) -> TunedModelRead:
    """Return details for a single fine-tuned model."""
    model = get_model(session, model_id, current_user.id)
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model not found.")
    return TunedModelRead.model_validate(model, from_attributes=True)
