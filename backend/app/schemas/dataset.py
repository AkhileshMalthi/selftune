from datetime import datetime
from typing import Annotated

from pydantic import Field
from sqlmodel import SQLModel

# ---- Reusable aliases -------------------------------------------------------

S3KeyField = Annotated[str, Field(description="S3 object key for the dataset file")]
UploadIdField = Annotated[str, Field(description="S3 multipart UploadId")]

# ---- Request schemas --------------------------------------------------------


class PresignedUrlRequest(SQLModel):
    filename: Annotated[str, Field(description="Original filename of the dataset")]


class RegisterDatasetRequest(SQLModel):
    s3_key: S3KeyField
    name: Annotated[str, Field(description="Human-readable dataset name")]
    original_filename: Annotated[str, Field(description="Original filename")]


class MultipartInitiateRequest(SQLModel):
    filename: Annotated[str, Field(description="Original filename of the dataset")]


class MultipartPresignRequest(SQLModel):
    s3_key: S3KeyField
    upload_id: UploadIdField
    part_numbers: Annotated[
        list[int], Field(description="List of 1-based part numbers to presign")
    ]


class MultipartPart(SQLModel):
    part_number: Annotated[int, Field(ge=1)]
    etag: Annotated[str, Field(description="ETag returned by S3 for this part")]


class MultipartCompleteRequest(SQLModel):
    s3_key: S3KeyField
    upload_id: UploadIdField
    name: Annotated[str, Field(description="Human-readable dataset name")]
    original_filename: Annotated[str, Field(description="Original filename")]
    parts: Annotated[list[MultipartPart], Field(description="Uploaded parts with ETags")]


# ---- Response schemas -------------------------------------------------------


class PresignedUrlResponse(SQLModel):
    upload_url: Annotated[str, Field(description="Presigned PUT URL")]
    s3_key: S3KeyField


class MultipartInitiateResponse(SQLModel):
    s3_key: S3KeyField
    upload_id: UploadIdField


class MultipartPresignResponse(SQLModel):
    parts: Annotated[
        dict[int, str], Field(description="Map of part_number → presigned URL")
    ]


class DatasetRead(SQLModel):
    id: Annotated[int, Field(description="Dataset ID")]
    name: Annotated[str, Field(description="Dataset name")]
    original_filename: Annotated[str, Field(description="Original filename")]
    status: Annotated[str, Field(description="processing | ready | failed")]
    created_at: Annotated[datetime, Field(description="Upload timestamp")]
    validation_report: Annotated["ValidationReportRead | None", Field(default=None)]


class ValidationReportRead(SQLModel):
    dataset_id: int
    total_rows: int
    valid_rows: int
    invalid_format_count: int
    max_tokens_per_row: int
    avg_tokens_per_row: float
    duplicate_count: int
    toxicity_score: float
    is_passed: bool
    error_message: str | None
    completed_at: datetime | None


class ValidationReportWebhookPayload(SQLModel):
    is_passed: bool
    error_message: str | None = None
    total_rows: int = 0
    valid_rows: int = 0
    invalid_format_count: int = 0
    max_tokens_per_row: int = 0
    avg_tokens_per_row: float = 0.0
    duplicate_count: int = 0
    toxicity_score: float = 0.0
