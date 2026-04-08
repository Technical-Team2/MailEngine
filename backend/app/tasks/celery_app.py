from celery import Celery
from ..config import settings

celery_app = Celery(
    "mailengine",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.campaign_tasks", "app.tasks.extraction_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Nairobi",
    enable_utc=True,
    task_track_started=True,
    # Beat schedule for daily extraction
    beat_schedule={
        "run-daily-extraction": {
            "task": "app.tasks.extraction_tasks.run_all_sources",
            "schedule": 86400,  # every 24 hours
        },
    },
)
