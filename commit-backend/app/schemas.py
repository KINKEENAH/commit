import re
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator

# Same four ids used in the frontend's lib/languages.ts — kept in sync by hand
# since the two projects don't share code.
Language = Literal["js", "python", "terminal", "plain"]


class ConfessionCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    language: Language


class ConfessionCreated(BaseModel):
    id: str


class SendRequest(BaseModel):
    recipient_phone: str = Field(..., min_length=7)
    # Optional: the sender's own number, used once to text them when a reply
    # arrives. An empty box means "no thanks".
    notify_phone: Optional[str] = None

    @field_validator("notify_phone", mode="before")
    @classmethod
    def _blank_means_none(cls, value):
        if value is None:
            return None
        if not isinstance(value, str):
            raise ValueError("notify_phone must be text")
        value = value.strip()
        if not value:
            return None
        if len(re.sub(r"\D", "", value)) < 7:
            raise ValueError("Enter a valid phone number")
        return value


class ConfessionPublic(BaseModel):
    """What the recipient screen gets — message and language only, nothing
    that would identify the sender."""

    message: str
    language: Language

    class Config:
        from_attributes = True


class StatusResponse(BaseModel):
    status: Literal["draft", "pending", "response_received"]
    response: Optional[str] = None
    responded_at: Optional[datetime] = None
    read_at: Optional[datetime] = None


class RespondRequest(BaseModel):
    # Free-text replies up to 500 characters, same cap as a confession.
    response: str = Field(..., min_length=1, max_length=500)
