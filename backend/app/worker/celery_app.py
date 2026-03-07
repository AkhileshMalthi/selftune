"""Celery application factory.

Celery is configured to use RabbitMQ as the message broker. Both the
FastAPI backend (producer) and the Celery worker process (consumer) import
this module to share the same app instance.
"""

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "selftune",
    broker=settings.CELERY_BROKER_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    # Discard results — we write directly to the DB instead
    task_ignore_result=True,
)
