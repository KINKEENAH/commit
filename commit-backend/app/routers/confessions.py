from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, sms
from ..database import get_db
from ..phone import normalize_ghana_phone

router = APIRouter(prefix="/confessions", tags=["confessions"])


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
    try:
        sms.send_confession_link(phone, confession_id)
    except Exception as e:
        # Surfaces the real SMS-provider error (bad credentials, sandbox
        # restriction, etc.) instead of a generic 500. Safe to expose here
        # since this endpoint only ever runs for the sender themselves.
        raise HTTPException(status_code=502, detail=f"SMS send failed: {e}") from e

    crud.mark_sent(db, confession, phone)
    return {"status": "sent"}


@router.get("/{confession_id}", response_model=schemas.ConfessionPublic)
def get_confession(confession_id: str, db: Session = Depends(get_db)):
    confession = crud.get_confession(db, confession_id)
    if not confession:
        raise HTTPException(status_code=404, detail="Confession not found")
    return confession


@router.post("/{confession_id}/respond", response_model=schemas.StatusResponse)
def respond_to_confession(
    confession_id: str, data: schemas.RespondRequest, db: Session = Depends(get_db)
):
    confession = crud.get_confession(db, confession_id)
    if not confession:
        raise HTTPException(status_code=404, detail="Confession not found")

    confession = crud.record_response(db, confession, data.response)
    return {"status": confession.status, "response": confession.response}


@router.get("/{confession_id}/status", response_model=schemas.StatusResponse)
def get_status(confession_id: str, db: Session = Depends(get_db)):
    confession = crud.get_confession(db, confession_id)
    if not confession:
        raise HTTPException(status_code=404, detail="Confession not found")
    return {"status": confession.status, "response": confession.response}
