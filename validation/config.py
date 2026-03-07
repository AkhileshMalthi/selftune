import os

class Settings:
    S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "http://minio:9000")
    S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
    S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin")
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "selftune-data")
    BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://backend:8000")
    MODERATION_API_KEY = os.getenv("MODERATION_API_KEY", "")
    TOXICITY_THRESHOLD = float(os.getenv("TOXICITY_THRESHOLD", "0.5"))
    WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "super-secret")

settings = Settings()
