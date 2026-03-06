import os
from celery import Celery

broker_url = os.getenv("CELERY_BROKER_URL", "amqp://guest:guest@rabbitmq:5672//")
result_backend = os.getenv("CELERY_RESULT_BACKEND", "rpc://")

app = Celery(
    "ml_worker",
    broker=broker_url,
    backend=result_backend,
    include=["training_loop"],
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "train_model_task": {"queue": "training"},
    },
)

if __name__ == "__main__":
    app.start()
