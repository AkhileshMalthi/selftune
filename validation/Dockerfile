FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install uv for blazingly fast dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

COPY . .

# Run the validation Celery worker
CMD ["celery", "-A", "worker", "worker", "--loglevel=info", "-Q", "celery", "--concurrency", "2"]
