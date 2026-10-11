import os
from datetime import datetime, timedelta, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from .database import SessionLocal
from . import crud, sms


def run_reminder_check() -> None:
    max_count = int(os.getenv("REMINDER_MAX_COUNT", "3"))
    interval_hours = int(os.getenv("REMINDER_INTERVAL_HOURS", "48"))
    cutoff = datetime.now(timezone.utc) - timedelta(hours=interval_hours)

    db = SessionLocal()
    try:
        candidates = crud.get_pending_for_reminder(db, max_count)
        for confession in candidates:
            if confession.last_reminded_at and confession.last_reminded_at > cutoff:
                continue  # this one isn't due yet
            if not confession.recipient_phone:
                continue
            sms.send_reminder(confession.recipient_phone, confession.id)
            crud.bump_reminder(db, confession)
    finally:
        db.close()


def start_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()
    # Checks every hour; run_reminder_check only actually texts confessions
    # whose own interval has elapsed AND are still under the reminder cap —
    # this is what keeps "keep prompting" from becoming indefinite nagging.
    scheduler.add_job(run_reminder_check, "interval", hours=1)
    scheduler.start()
    return scheduler
