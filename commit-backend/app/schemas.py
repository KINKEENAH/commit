from typing import Optional, Literal
from pydantic import BaseModel, Field

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


class RespondRequest(BaseModel):
    response: str = Field(..., min_length=1, max_length=100)
