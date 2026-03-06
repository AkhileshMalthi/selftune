from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, SessionDep
from app.core.storage import (
    complete_multipart_upload,
    generate_presigned_part_url,
    generate_presigned_put_url,
    initiate_multipart_upload,
    make_s3_key,
    object_exists,
)
from app.crud.dataset import (
    create_dataset,
    get_dataset,
    get_datasets_for_user,
    get_validation_report,
)
from app.schemas.dataset import (
    DatasetRead,
    MultipartCompleteRequest,
    MultipartInitiateRequest,
    MultipartInitiateResponse,
    MultipartPresignRequest,
    MultipartPresignResponse,
    PresignedUrlRequest,
    PresignedUrlResponse,
    RegisterDatasetRequest,
    ValidationReportRead,
)
from app.worker.tasks import validate_dataset_task

router = APIRouter()


# ---------------------------------------------------------------------------
# Simple upload  (files < threshold — decided by the frontend)
# ---------------------------------------------------------------------------


@router.post("/presigned-url", response_model=PresignedUrlResponse)
def get_presigned_url(body: PresignedUrlRequest, current_user: CurrentUser) -> PresignedUrlResponse:
    """Return a presigned PUT URL for a small dataset upload (< 100 MB).

    The S3 key is generated server-side so the client cannot pick its own
    storage path.
    """
    s3_key = make_s3_key(current_user.id, body.filename)
    upload_url = generate_presigned_put_url(s3_key)
    return PresignedUrlResponse(upload_url=upload_url, s3_key=s3_key)


@router.post("/register", response_model=DatasetRead, status_code=status.HTTP_201_CREATED)
def register_dataset(
    body: RegisterDatasetRequest,
    current_user: CurrentUser,
    session: SessionDep,
) -> DatasetRead:
    """Register a successfully uploaded dataset and queue validation.

    Called by the frontend after confirming the PUT upload to S3 succeeded.
    Verifies the object exists before writing to the database to avoid
    phantom records.
    """
    if not object_exists(body.s3_key):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The uploaded file was not found in storage. Please upload first.",
        )

    dataset = create_dataset(
        session,
        user_id=current_user.id,
        name=body.name,
        s3_key=body.s3_key,
        original_filename=body.original_filename,
    )
    validate_dataset_task.delay(dataset.id)
    return DatasetRead.model_validate(dataset, from_attributes=True)


# ---------------------------------------------------------------------------
# Multipart upload  (files >= 100 MB)
# ---------------------------------------------------------------------------


@router.post("/multipart/initiate", response_model=MultipartInitiateResponse)
def multipart_initiate(
    body: MultipartInitiateRequest, current_user: CurrentUser
) -> MultipartInitiateResponse:
    """Start a multipart upload session.

    Returns a server-generated S3 key and UploadId. The frontend must use
    *this* key for all subsequent presign and complete calls.
    """
    s3_key = make_s3_key(current_user.id, body.filename)
    upload_id = initiate_multipart_upload(s3_key)
    return MultipartInitiateResponse(s3_key=s3_key, upload_id=upload_id)


@router.post("/multipart/presign", response_model=MultipartPresignResponse)
def multipart_presign(
    body: MultipartPresignRequest, current_user: CurrentUser  # noqa: ARG001
) -> MultipartPresignResponse:
    """Return presigned PUT URLs for each requested part number."""
    urls = {
        part_num: generate_presigned_part_url(body.s3_key, body.upload_id, part_num)
        for part_num in body.part_numbers
    }
    return MultipartPresignResponse(parts=urls)


@router.post("/multipart/complete", response_model=DatasetRead, status_code=status.HTTP_201_CREATED)
def multipart_complete(
    body: MultipartCompleteRequest,
    current_user: CurrentUser,
    session: SessionDep,
) -> DatasetRead:
    """Complete the multipart upload, register in DB, and queue validation."""
    parts = [{"PartNumber": p.part_number, "ETag": p.etag} for p in body.parts]
    complete_multipart_upload(body.s3_key, body.upload_id, parts)

    dataset = create_dataset(
        session,
        user_id=current_user.id,
        name=body.name,
        s3_key=body.s3_key,
        original_filename=body.original_filename,
    )
    validate_dataset_task.delay(dataset.id)
    return DatasetRead.model_validate(dataset, from_attributes=True)


# ---------------------------------------------------------------------------
# Read endpoints
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[DatasetRead])
def list_datasets(current_user: CurrentUser, session: SessionDep) -> list[DatasetRead]:
    """Return all datasets belonging to the authenticated user."""
    datasets = get_datasets_for_user(session, current_user.id)
    return [DatasetRead.model_validate(d, from_attributes=True) for d in datasets]


@router.get("/{dataset_id}", response_model=DatasetRead)
def get_dataset_detail(
    dataset_id: int, current_user: CurrentUser, session: SessionDep
) -> DatasetRead:
    """Return a single dataset (must belong to the current user)."""
    dataset = get_dataset(session, dataset_id, current_user.id)
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")
    return DatasetRead.model_validate(dataset, from_attributes=True)


@router.get("/{dataset_id}/report", response_model=ValidationReportRead)
def get_dataset_report(
    dataset_id: int, current_user: CurrentUser, session: SessionDep
) -> ValidationReportRead:
    """Return the validation report for a dataset.

    Returns 404 if the dataset doesn't belong to the user, and 202 if
    validation is still in progress.
    """
    dataset = get_dataset(session, dataset_id, current_user.id)
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")

    if dataset.status == "processing":
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="Validation is still in progress.",
        )

    report = get_validation_report(session, dataset_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Validation report not found."
        )
    return ValidationReportRead.model_validate(report, from_attributes=True)
