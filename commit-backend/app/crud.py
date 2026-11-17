from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from . import models, schemas


def create_confession(db: Session, data: schemas.ConfessionCreate) -> models.Confession:
    confession = models.Confession(message=data.message, language=data.language)
    db.add(confession)
    db.commit()
    db.refresh(confession)
    return confession


def get_confession(db: Session, confession_id: str) -> Optional[models.Confession]:
    return db.get(models.Confession, confession_id)


def mark_sent(
    db: Session,
    confession: models.Confession,
    recipient_phone: str,
    notify_phone: Optional[str] = None,
) -> models.Confession:
    confession.recipient_phone = recipient_phone
    confession.notify_phone = notify_phone
    confession.status = "pending"
    confession.last_reminded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(confession)
    return confession


def mark_read(db: Session, confession: models.Confession) -> models.Confession:
    """Records the first time the message was read. Later calls change nothing,
    so reloading the page can't move the timestamp."""
    if confession.read_at is None:
        confession.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(confession)
    return confession


def record_response(db: Session, confession: models.Confession, response: str) -> models.Confession:
    now = datetime.now(timezone.utc)
    confession.status = "response_received"
    confession.response = response
    confession.responded_at = now
    if confession.read_at is None:
        confession.read_at = now  # a reply implies it was read
    db.commit()
    db.refresh(confession)
    return confession


def pop_notify_phone(db: Session, confession: models.Confession) -> Optional[str]:
    """Returns the sender's opt-in alert number and erases it, so it is used
    for exactly one text and isn't kept once it has done its job."""
    phone = confession.notify_phone
    if phone:
        confession.notify_phone = None
        db.commit()
        db.refresh(confession)
    return phone


def get_pending_for_reminder(db: Session, max_count: int):
    return (
        db.query(models.Confession)
        .filter(models.Confession.status == "pending")
        .filter(models.Confession.read_at.is_(None))  # stop nudging once it's been read
        .filter(models.Confession.reminder_count < max_count)
        .all()
    )


def bump_reminder(db: Session, confession: models.Confession) -> models.Confession:
    confession.reminder_count += 1
    confession.last_reminded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(confession)
    return confession
