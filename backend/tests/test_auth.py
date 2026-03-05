"""
Tests for JWT authentication endpoints.

Covers: register, login, refresh, /me (authed + unauthed), and edge cases.
"""

from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

REGISTER_URL = "/api/v1/auth/register"
LOGIN_URL = "/api/v1/auth/login"
REFRESH_URL = "/api/v1/auth/refresh"
ME_URL = "/api/v1/auth/me"

TEST_EMAIL = "user@test.com"
TEST_PASSWORD = "SecurePass123!"


def register_user(client: TestClient, email=TEST_EMAIL, password=TEST_PASSWORD):
    """Register a user and return the response."""
    return client.post(REGISTER_URL, json={"email": email, "password": password})


def login_user(client: TestClient, email=TEST_EMAIL, password=TEST_PASSWORD):
    """Login and return the token response JSON."""
    resp = client.post(LOGIN_URL, data={"username": email, "password": password})
    return resp


def auth_headers(client: TestClient, email=TEST_EMAIL, password=TEST_PASSWORD) -> dict:
    """Register + login, return Bearer header dict."""
    register_user(client, email, password)
    resp = login_user(client, email, password)
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------


class TestRegister:
    def test_register_success(self, client: TestClient):
        resp = register_user(client)
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == TEST_EMAIL
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data
        assert "password" not in data
        assert "hashed_password" not in data

    def test_register_duplicate_email(self, client: TestClient):
        register_user(client)
        resp = register_user(client)  # same email
        assert resp.status_code == 409
        assert "already exists" in resp.json()["detail"].lower()

    def test_register_invalid_email(self, client: TestClient):
        resp = client.post(
            REGISTER_URL, json={"email": "not-an-email", "password": "pass"}
        )
        assert resp.status_code == 422

    def test_register_missing_fields(self, client: TestClient):
        resp = client.post(REGISTER_URL, json={"email": TEST_EMAIL})
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------


class TestLogin:
    def test_login_success(self, client: TestClient):
        register_user(client)
        resp = login_user(client)
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client: TestClient):
        register_user(client)
        resp = login_user(client, password="WrongPass!")
        assert resp.status_code == 401

    def test_login_unknown_email(self, client: TestClient):
        resp = login_user(client, email="nobody@test.com")
        assert resp.status_code == 401

    def test_login_returns_non_empty_tokens(self, client: TestClient):
        register_user(client)
        data = login_user(client).json()
        assert len(data["access_token"]) > 20
        assert len(data["refresh_token"]) > 20

    def test_login_access_and_refresh_are_different(self, client: TestClient):
        register_user(client)
        data = login_user(client).json()
        assert data["access_token"] != data["refresh_token"]


# ---------------------------------------------------------------------------
# Protected /me endpoint
# ---------------------------------------------------------------------------


class TestMe:
    def test_me_authenticated(self, client: TestClient):
        headers = auth_headers(client)
        resp = client.get(ME_URL, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == TEST_EMAIL
        assert data["is_active"] is True

    def test_me_unauthenticated(self, client: TestClient):
        resp = client.get(ME_URL)
        assert resp.status_code == 401

    def test_me_invalid_token(self, client: TestClient):
        resp = client.get(
            ME_URL, headers={"Authorization": "Bearer invalid.token.here"}
        )
        assert resp.status_code == 401

    def test_me_malformed_header(self, client: TestClient):
        resp = client.get(ME_URL, headers={"Authorization": "NotBearer token"})
        assert resp.status_code == 401

    def test_me_no_password_in_response(self, client: TestClient):
        headers = auth_headers(client)
        data = client.get(ME_URL, headers=headers).json()
        assert "password" not in data
        assert "hashed_password" not in data


# ---------------------------------------------------------------------------
# Token refresh
# ---------------------------------------------------------------------------


class TestRefresh:
    def test_refresh_success(self, client: TestClient):
        register_user(client)
        tokens = login_user(client).json()
        resp = client.post(REFRESH_URL, json={"refresh_token": tokens["refresh_token"]})
        assert resp.status_code == 200
        new_tokens = resp.json()
        assert "access_token" in new_tokens
        assert "refresh_token" in new_tokens

    def test_refresh_new_access_token_works(self, client: TestClient):
        register_user(client)
        tokens = login_user(client).json()
        new_tokens = client.post(
            REFRESH_URL, json={"refresh_token": tokens["refresh_token"]}
        ).json()
        resp = client.get(
            ME_URL, headers={"Authorization": f"Bearer {new_tokens['access_token']}"}
        )
        assert resp.status_code == 200

    def test_refresh_with_access_token_rejected(self, client: TestClient):
        """Using an access token where a refresh token is expected should fail."""
        register_user(client)
        tokens = login_user(client).json()
        resp = client.post(REFRESH_URL, json={"refresh_token": tokens["access_token"]})
        assert resp.status_code == 401

    def test_refresh_invalid_token(self, client: TestClient):
        resp = client.post(REFRESH_URL, json={"refresh_token": "garbage.token.value"})
        assert resp.status_code == 401

    def test_refresh_missing_body(self, client: TestClient):
        resp = client.post(REFRESH_URL, json={})
        assert resp.status_code == 422
