from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlmodel import Session

from app.models.tuned_model import TunedModel
from tests.test_auth import auth_headers


def _seed_model(session: Session, user_id: int, job_id: int) -> TunedModel:
    model = TunedModel(user_id=user_id, job_id=job_id, name="Test Adapter", base_model="test-model", s3_key="test-key")
    session.add(model)
    session.commit()
    session.refresh(model)
    return model


class TestModelsAPI:
    def test_list_models(self, client: TestClient, session: Session):
        headers = auth_headers(client, email="model_user1@example.com")
        db_user = session.execute(text("SELECT id FROM users WHERE email='model_user1@example.com'")).fetchone()
        
        _seed_model(session, db_user[0], 100)
        _seed_model(session, db_user[0], 101)
        
        resp = client.get("/api/v1/models/", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_get_model_detail(self, client: TestClient, session: Session):
        headers = auth_headers(client, email="model_user2@example.com")
        db_user = session.execute(text("SELECT id FROM users WHERE email='model_user2@example.com'")).fetchone()
        
        model = _seed_model(session, db_user[0], 200)
        
        resp = client.get(f"/api/v1/models/{model.id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test Adapter"
        assert resp.json()["s3_key"] == "test-key"

    def test_get_model_detail_404(self, client: TestClient, session: Session):
        headers = auth_headers(client, email="model_user3@example.com")
        resp = client.get("/api/v1/models/999", headers=headers)
        assert resp.status_code == 404
