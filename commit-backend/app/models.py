import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer
from .database import Base


def generate_id() -> str:
    # Short, URL-friendly id — this is the SAME token used in the recipient
    # link (commit.app/r/<id>) and for the sender checking status later.
    # Whoever has the id can view the confession; that's the same trust
    # model as the link itself, not a separate security boundary.
    return uuid.uuid4().hex[:8]


class Confession(Base):
    __tablename__ = "confessions"

    id = Column(String, primary_key=True, default=generate_id)
    message = Column(Text, nullable=False)
    language = Column(String, nullable=False)  # "js" | "python" | "terminal" | "plain"
    recipient_phone = Column(String, nullable=True)
    # draft = created but not sent yet; pending = sent, waiting on a reply;
    # response_received = recipient replied.
    status = Column(String, nullable=False, default="draft")
    response = Column(String, nullable=True)
    reminder_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_reminded_at = Column(DateTime, nullable=True)
