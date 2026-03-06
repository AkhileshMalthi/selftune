from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlmodel import Session

from app.models.dataset import Dataset
from app.models.job import FineTuningJob
from tests.test_auth import auth_headers


def _seed_dataset(session: Session, user_id: int, status: str = "ready") -> Dataset:
    dataset = Dataset(user_id=user_id, name="Test Data", s3_key="test.jsonl", original_filename="test.jsonl", status=status)
    session.add(dataset)
    session.commit()
    session.refresh(dataset)
    return dataset


def _seed_job(session: Session, user_id: int, dataset_id: int) -> FineTuningJob:
    job = FineTuningJob(user_id=user_id, dataset_id=dataset_id, base_model="test-model", learning_rate=0.001, num_epochs=1)
    session.add(job)
    session.commit()
    session.refresh(job)
    return job


class TestJobsAPI:
    def test_launch_job_success(self, client: TestClient, session: Session):
        headers = auth_headers(client, email="job_user@example.com")
        
        # Get user ID from a quick request
        resp = client.get("/api/v1/datasets", headers=headers) # just to init user
        
        # Seed a dataset for this user
        user_id = 1 # Assuming it's the first user created or we can query it
        # Actually safer to let the client endpoint fail if we guess wrong, but for tests:
        db_user = session.execute(text("SELECT id FROM users WHERE email='job_user@example.com'")).fetchone()
        user_id = db_user[0]
        
        dataset = _seed_dataset(session, user_id, status="ready")
        
        with patch("app.api.routes.jobs.celery_app.send_task") as mock_send_task:
            resp = client.post(
                "/api/v1/jobs/",
                json={
                    "dataset_id": dataset.id,
                    "base_model": "HuggingFaceTB/SmolLM-135M",
                    "learning_rate": 0.0002,
                    "num_epochs": 3
                },
                headers=headers
            )
            assert resp.status_code == 201
            data = resp.json()
            assert data["base_model"] == "HuggingFaceTB/SmolLM-135M"
            assert data["status"] == "queued"
            
            mock_send_task.assert_called_once()
            
    def test_launch_job_dataset_unready(self, client: TestClient, session: Session):
        headers = auth_headers(client, email="job_user2@example.com")
        db_user = session.execute(text("SELECT id FROM users WHERE email='job_user2@example.com'")).fetchone()
        
        dataset = _seed_dataset(session, db_user[0], status="processing")
        
        resp = client.post(
            "/api/v1/jobs/",
            json={"dataset_id": dataset.id, "base_model": "test"},
            headers=headers
        )
        assert resp.status_code == 400
        assert "not ready" in resp.json()["detail"]

    def test_list_jobs(self, client: TestClient, session: Session):
        headers = auth_headers(client, email="job_user3@example.com")
        db_user = session.execute(text("SELECT id FROM users WHERE email='job_user3@example.com'")).fetchone()
        
        dataset = _seed_dataset(session, db_user[0])
        _seed_job(session, db_user[0], dataset.id)
        _seed_job(session, db_user[0], dataset.id)
        
        resp = client.get("/api/v1/jobs/", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_get_job_detail(self, client: TestClient, session: Session):
        headers = auth_headers(client, email="job_user4@example.com")
        db_user = session.execute(text("SELECT id FROM users WHERE email='job_user4@example.com'")).fetchone()
        
        dataset = _seed_dataset(session, db_user[0])
        job = _seed_job(session, db_user[0], dataset.id)
        
        resp = client.get(f"/api/v1/jobs/{job.id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["base_model"] == "test-model"
