import boto3
from config import settings

def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
    )

def stream_object_lines(key: str):
    s3 = get_s3_client()
    resp = s3.get_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
    body = resp["Body"]
    for line in body.iter_lines():
        if line:
            yield line.decode("utf-8")
