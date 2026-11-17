import logging
from datetime import timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, sms
from ..database import get_db
from ..phone import normalize_ghana_phone

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/confessions", tags=["confessions"])


def _alert_sender(phone: str, confession_id: str) -> None:
    # Runs after the reply has already been saved and returned to the
    # recipient. A failed alert is logged, never surfaced to them.
    try:
        sms.send_reply_alert(phone, confession_id)
    except Exception:
        logger.exception("Reply alert failed for confession %s", confession_id)


def _as_utc(at):
    # The columns store naive UTC; mark them as UTC so clients parse them correctly.
    if at is not None and at.tzinfo is None:
        return at.replace(tzinfo=timezone.utc)
    return at


def _status_payload(confession):
    return {
        "status": confession.status,
        "response": confession.response,
        "responded_at": _as_utc(confession.responded_at),
        "read_at": _as_utc(confession.read_at),
    }


@router.post("", response_model=schemas.ConfessionCreated)
def create_confession(data: schemas.ConfessionCreate, db: Session = Depends(get_db)):
    confession = crud.create_confession(db, data)
    return {"id": confession.id}


@router.post("/{confession_id}/send")
def send_confession(confession_id: str, data: schemas.SendRequest, db: Session = Depends(get_db)):
    confession = crud.get_confession(db, confession_id)
    if not confession:
        raise HTTPException(status_code=404, detail="Confession not found")

    phone = normalize_ghana_phone(data.recipient_phone)
    notify_phone = normalize_ghana_phone(data.notify_phone) if data.notify_phone else None
    try:
        sms.send_confession_link(phone, confession_id)
    except Exception as e:
        # Surfaces the real SMS-provider error (bad credentials, sandbox
        # restriction, etc.) instead of a generic 500. Safe to expose here
        # since this endpoint only ever runs for the sender themselves.
        raise HTTPException(status_code=502, detail=f"SMS send failed: {e}") from e

    crud.mark_sent(db, confession, phone, notify_phone)
    return {"status": "sent"}


@router.get("/{confession_id}", response_model=schemas.ConfessionPublic)
def get_confession(confession_id: str, db: Session = Depends(get_db)):
    confession = crud.get_confession(db, confession_id)
    if not confession:
        raise HTTPException(status_code=404, detail="Confession not found")
    return confession


@router.post("/{confession_id}/read")
def mark_confession_read(confession_id: str, db: Session = Depends(get_db)):
    # Called by the recipient page when the message is actually shown to them.
    # A POST (not the GET that loads the message) so link-preview bots that
    # only fetch the page never trigger it.
    confession = crud.get_confession(db, confession_id)
    if not confession or confession.status == "draft":
        raise HTTPException(status_code=404, detail="Confession not found")
    crud.mark_read(db, confession)
    return {"ok": True}


@router.post("/{confession_id}/respond", response_model=schemas.StatusResponse)
def respond_to_confession(
    confession_id: str,
    data: schemas.RespondRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    confession = crud.get_confession(db, confession_id)
    if not confession:
        raise HTTPException(status_code=404, detail="Confession not found")

    confession = crud.record_response(db, confession, data.response)

    # If the sender opted in, text them once (the number is erased as it is
    # taken, so a later edit of the reply won't text them again).
    notify_phone = crud.pop_notify_phone(db, confession)
    if notify_phone:
        background_tasks.add_task(_alert_sender, notify_phone, confession.id)

    return _status_payload(confession)


@router.get("/{confession_id}/status", response_model=schemas.StatusResponse)
def get_status(confession_id: str, db: Session = Depends(get_db)):
    confession = crud.get_confession(db, confession_id)
    if not confession:
        raise HTTPException(status_code=404, detail="Confession not found")
    return _status_payload(confession)
