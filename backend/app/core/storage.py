"""S3 / MinIO client wrapper.

All interaction with object storage goes through this module so that
switching between MinIO (local) and a real S3 bucket (production) only
requires changing environment variables — not touching application code.
"""

import uuid

import boto3
from botocore.config import Config

from app.core.config import settings

# ---------------------------------------------------------------------------
# Client factory
# ---------------------------------------------------------------------------

def _make_client() -> boto3.client:
    """Return a pre-configured boto3 S3 client."""
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        config=Config(signature_version="s3v4"),
    )


# ---------------------------------------------------------------------------
# Bucket bootstrap
# ---------------------------------------------------------------------------

def ensure_bucket_exists() -> None:
    """Create the configured S3 bucket if it does not already exist.

    Called once at application startup. Failures are non-fatal — S3 may not
    be reachable yet (e.g. container still starting, or test environment).
    """
    import logging  # noqa: PLC0415

    logger = logging.getLogger(__name__)
    try:
        client = _make_client()
        try:
            client.head_bucket(Bucket=settings.S3_BUCKET_NAME)
        except client.exceptions.ClientError:
            client.create_bucket(Bucket=settings.S3_BUCKET_NAME)
    except Exception as exc:  # noqa: BLE001
        logger.warning("S3 bucket bootstrap skipped — could not reach storage: %s", exc)


# ---------------------------------------------------------------------------
# Key generation
# ---------------------------------------------------------------------------

def make_s3_key(user_id: int, filename: str) -> str:
    """Return a locked, unique S3 key for a user's upload.

    The key embeds the user_id and a UUID so the user cannot influence the
    storage path, preventing path-traversal or overwrite attacks.
    """
    suffix = filename.rsplit(".", 1)[-1] if "." in filename else "jsonl"
    return f"datasets/{user_id}/{uuid.uuid4()}.{suffix}"


# ---------------------------------------------------------------------------
# Simple upload  (<threshold)
# ---------------------------------------------------------------------------

def generate_presigned_put_url(s3_key: str) -> str:
    """Generate a presigned PUT URL for a single-part upload."""
    client = _make_client()
    return client.generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": s3_key},
        ExpiresIn=settings.S3_PRESIGN_EXPIRY_SECONDS,
    )


def object_exists(s3_key: str) -> bool:
    """Return True if the object exists in S3 (used to verify registration)."""
    client = _make_client()
    try:
        client.head_object(Bucket=settings.S3_BUCKET_NAME, Key=s3_key)
        return True
    except client.exceptions.ClientError:
        return False


# ---------------------------------------------------------------------------
# Multipart upload  (>= threshold)
# ---------------------------------------------------------------------------

def initiate_multipart_upload(s3_key: str) -> str:
    """Start a multipart upload and return the UploadId."""
    client = _make_client()
    response = client.create_multipart_upload(
        Bucket=settings.S3_BUCKET_NAME,
        Key=s3_key,
        ContentType="application/x-ndjson",
    )
    return response["UploadId"]


def generate_presigned_part_url(s3_key: str, upload_id: str, part_number: int) -> str:
    """Generate a presigned PUT URL for a single multipart chunk."""
    client = _make_client()
    return client.generate_presigned_url(
        "upload_part",
        Params={
            "Bucket": settings.S3_BUCKET_NAME,
            "Key": s3_key,
            "UploadId": upload_id,
            "PartNumber": part_number,
        },
        ExpiresIn=settings.S3_PRESIGN_EXPIRY_SECONDS,
    )


def complete_multipart_upload(
    s3_key: str, upload_id: str, parts: list[dict]
) -> dict:
    """Complete a multipart upload.

    Args:
        s3_key: S3 object key.
        upload_id: The UploadId from ``initiate_multipart_upload``.
        parts: List of ``{"PartNumber": int, "ETag": str}`` dicts from the client.

    Returns:
        The boto3 response dict (contains ``ETag``, ``Location``, etc.).
    """
    client = _make_client()
    return client.complete_multipart_upload(
        Bucket=settings.S3_BUCKET_NAME,
        Key=s3_key,
        UploadId=upload_id,
        MultipartUpload={"Parts": parts},
    )


# ---------------------------------------------------------------------------
# Streaming (used by the Celery validation worker)
# ---------------------------------------------------------------------------

def stream_object_lines(s3_key: str):
    """Yield decoded text lines from an S3 object without loading it fully."""
    client = _make_client()
    obj = client.get_object(Bucket=settings.S3_BUCKET_NAME, Key=s3_key)
    for raw_line in obj["Body"].iter_lines():
        yield raw_line.decode("utf-8")


def upload_bytes(s3_key: str, data: bytes) -> None:
    """Upload raw bytes to S3 (used to write the cleaned dataset back)."""
    client = _make_client()
    client.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=s3_key,
        Body=data,
        ContentType="application/x-ndjson",
    )
