from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "selftune API"
    API_V1_STR: str = "/api/v1"

    # JWT
    SECRET_KEY: str = "change-this-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "sqlite:///./selftune.db"

    # Celery / RabbitMQ
    CELERY_BROKER_URL: str = "amqp://guest:guest@localhost:5672/"

    # S3 / MinIO
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "selftune-datasets"
    S3_PRESIGN_EXPIRY_SECONDS: int = 3600
    S3_MULTIPART_THRESHOLD_MB: int = 100

    # Toxicity moderation
    MODERATION_API_KEY: str = ""
    TOXICITY_THRESHOLD: float = 0.7

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
