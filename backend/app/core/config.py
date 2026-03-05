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

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
