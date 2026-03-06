"""
Tests for Dataset management endpoints.

Covers: Simple uploads, multipart uploads, dataset retrieval, and validation
report reads. Uses mocked S3 and Celery task calls to isolate API logic.
"""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models.dataset import Dataset, DatasetValidationReport

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
# Use the helpers from test_auth to get an authenticated client session
from tests.test_auth import auth_headers

PRESIGNED_URL = "/api/v1/datasets/presigned-url"
REGISTER_URL = "/api/v1/datasets/register"
MP_INITIATE_URL = "/api/v1/datasets/multipart/initiate"
MP_PRESIGN_URL = "/api/v1/datasets/multipart/presign"
MP_COMPLETE_URL = "/api/v1/datasets/multipart/complete"
DATASETS_BASE = "/api/v1/datasets"


@pytest.fixture(autouse=True)
def mock_storage():
    """Mock all external network calls to S3/Celery in the dataset API router."""
    with patch("app.api.routes.datasets.object_exists", return_value=True) as m_exists, \
         patch("app.api.routes.datasets.initiate_multipart_upload", return_value="test_upload_id") as m_init, \
         patch("app.api.routes.datasets.generate_presigned_put_url", return_value="https://mock/put") as m_put, \
         patch("app.api.routes.datasets.generate_presigned_part_url", return_value="https://mock/part") as m_part, \
         patch("app.api.routes.datasets.complete_multipart_upload", return_value={}) as m_complete, \
         patch("app.api.routes.datasets.validate_dataset_task.delay") as m_celery:
        yield {
            "exists": m_exists,
            "init": m_init,
            "put": m_put,
            "part": m_part,
            "complete": m_complete,
            "celery": m_celery,
        }


def get_auth_client(client: TestClient) -> dict:
    """Return headers for a fresh authenticated user."""
    # Ensure fresh email to avoid unique constraint errors during test collection
    import uuid
    email = f"test_{uuid.uuid4()}@example.com"
    return auth_headers(client, email=email)


# ---------------------------------------------------------------------------
# Simple Upload Flow
# ---------------------------------------------------------------------------


class TestSimpleUpload:
    def test_get_presigned_url(self, client: TestClient, mock_storage):
        headers = get_auth_client(client)
        resp = client.post(PRESIGNED_URL, json={"filename": "data.jsonl"}, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "upload_url" in data
        assert "s3_key" in data
        assert data["upload_url"] == "https://mock/put"
        assert data["s3_key"].endswith(".jsonl")

    def test_register_dataset_success(self, client: TestClient, mock_storage):
        headers = get_auth_client(client)
        resp = client.post(
            REGISTER_URL,
            json={"s3_key": "datasets/1/test.jsonl", "name": "My Dataset", "original_filename": "data.jsonl"},
            headers=headers
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "My Dataset"
        assert data["status"] == "processing"
        
        # Verify validation task was queued
        dataset_id = data["id"]
        mock_storage["celery"].assert_called_once_with(dataset_id)

    def test_register_fails_if_unauthorized(self, client: TestClient):
        resp = client.post(
            REGISTER_URL,
            json={"s3_key": "fake", "name": "fake", "original_filename": "fake"}
        )
        assert resp.status_code == 401

    def test_register_fails_if_s3_object_missing(self, client: TestClient, mock_storage):
        headers = get_auth_client(client)
        mock_storage["exists"].return_value = False
        
        resp = client.post(
            REGISTER_URL,
            json={"s3_key": "datasets/1/test.jsonl", "name": "My Dataset", "original_filename": "data.jsonl"},
            headers=headers
        )
        assert resp.status_code == 404
        assert "not found in storage" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Multipart Upload Flow
# ---------------------------------------------------------------------------


class TestMultipartUpload:
    def test_initiate(self, client: TestClient, mock_storage):
        headers = get_auth_client(client)
        resp = client.post(MP_INITIATE_URL, json={"filename": "huge.jsonl"}, headers=headers)
        
        assert resp.status_code == 200
        data = resp.json()
        assert data["upload_id"] == "test_upload_id"
        assert data["s3_key"].endswith(".jsonl")
        assert "datasets/" in data["s3_key"]

    def test_presign_parts(self, client: TestClient, mock_storage):
        headers = get_auth_client(client)
        resp = client.post(
            MP_PRESIGN_URL,
            json={
                "s3_key": "fake_key",
                "upload_id": "fake_id",
                "part_numbers": [1, 2, 3]
            },
            headers=headers
        )
        
        assert resp.status_code == 200
        data = resp.json()
        parts = data["parts"]
        assert len(parts) == 3
        # Fast API serializes dict keys to strings in JSON
        assert parts["1"] == "https://mock/part"
        assert parts["2"] == "https://mock/part"

    def test_complete(self, client: TestClient, mock_storage):
        headers = get_auth_client(client)
        resp = client.post(
            MP_COMPLETE_URL,
            json={
                "s3_key": "key",
                "upload_id": "id",
                "name": "Big Data",
                "original_filename": "huge.jsonl",
                "parts": [{"part_number": 1, "etag": "abc"}, {"part_number": 2, "etag": "def"}]
            },
            headers=headers
        )
        
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Big Data"
        assert data["status"] == "processing"
        
        # Verify complete logic and queued task
        mock_storage["complete"].assert_called_once_with(
            "key", "id", [{"PartNumber": 1, "ETag": "abc"}, {"PartNumber": 2, "ETag": "def"}]
        )
        mock_storage["celery"].assert_called_once_with(data["id"])


# ---------------------------------------------------------------------------
# Read Operations (GET datasets / reports)
# ---------------------------------------------------------------------------


class TestDatasetReads:
    def _seed_dataset(self, client: TestClient, headers: dict) -> dict:
        """Helper to create a dataset inside the test DB."""
        return client.post(
            REGISTER_URL,
            json={"s3_key": "k", "name": "N", "original_filename": "of"},
            headers=headers
        ).json()

    def test_list_datasets(self, client: TestClient, mock_storage):
        headers1 = get_auth_client(client)
        headers2 = get_auth_client(client) # different user
        
        # User 1 makes a dataset
        self._seed_dataset(client, headers1)
        self._seed_dataset(client, headers1)
        
        # User 2 makes a dataset
        self._seed_dataset(client, headers2)

        # Ensure user 1 only sees their 2 datasets
        resp = client.get(DATASETS_BASE, headers=headers1)
        assert resp.status_code == 200
        assert len(resp.json()) == 2
        
        # Ensure user 2 only sees their 1 dataset
        resp2 = client.get(DATASETS_BASE, headers=headers2)
        assert len(resp2.json()) == 1

    def test_get_dataset_detail(self, client: TestClient, mock_storage):
        headers = get_auth_client(client)
        ds = self._seed_dataset(client, headers)
        
        resp = client.get(f"{DATASETS_BASE}/{ds['id']}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "N"

    def test_get_dataset_returns_404_for_other_user(self, client: TestClient, mock_storage):
        headers1 = get_auth_client(client)
        headers2 = get_auth_client(client)
        
        ds = self._seed_dataset(client, headers1)
        
        # User 2 tries to read user 1's dataset
        resp = client.get(f"{DATASETS_BASE}/{ds['id']}", headers=headers2)
        assert resp.status_code == 404

    def test_get_report_processing(self, client: TestClient, mock_storage):
        headers = get_auth_client(client)
        ds = self._seed_dataset(client, headers) # status defaults to processing
        
        resp = client.get(f"{DATASETS_BASE}/{ds['id']}/report", headers=headers)
        assert resp.status_code == 202
        assert "still in progress" in resp.json()["detail"]

    def test_get_report_ready(self, client: TestClient, session: Session, mock_storage):
        headers = get_auth_client(client)
        ds = self._seed_dataset(client, headers)
        ds_id = ds["id"]
        
        # Manually seed a report and flip status to ready in the DB
        report = DatasetValidationReport(
            dataset_id=ds_id,
            total_rows=10,
            valid_rows=10,
            invalid_format_count=0,
            max_tokens_per_row=100,
            avg_tokens_per_row=50.0,
            duplicate_count=0,
            toxicity_score=0.1,
            is_passed=True
        )
        session.add(report)
        db_ds = session.get(Dataset, ds_id)
        db_ds.status = "ready"
        session.commit()
        
        resp = client.get(f"{DATASETS_BASE}/{ds_id}/report", headers=headers)
        assert resp.status_code == 200
        
        data = resp.json()
        assert data["is_passed"] is True
        assert data["toxicity_score"] == 0.1
