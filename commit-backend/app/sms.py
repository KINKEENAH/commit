import logging
import os
import africastalking

logger = logging.getLogger("uvicorn.error")

_initialized = False

# Africa's Talking status codes for a recipient: 100 processed, 101 sent,
# 102 queued. Anything else (e.g. invalid number, blacklisted) is a rejection.
_ACCEPTED_CODES = {100, 101, 102}


def _ensure_initialized() -> None:
    global _initialized
    if _initialized:
        return
    username = os.getenv("AT_USERNAME")
    api_key = os.getenv("AT_API_KEY")
    if not username or not api_key:
        raise RuntimeError("AT_USERNAME and AT_API_KEY must be set — see .env.example")
    africastalking.initialize(username, api_key)
    _initialized = True


def _send(body: str, to_phone: str) -> None:
    _ensure_initialized()
    sms = africastalking.SMS
    # A custom sender id is only sent when one is configured. The sandbox
    # can't use one at all, and a production app can't either until the
    # name has been approved. In both cases leave it out and Africa's
    # Talking uses its default sender. Passing an unapproved one (or an
    # empty string) fails with InvalidSenderId.
    sender_id = (os.getenv("AT_SENDER_ID") or "").strip()
    if os.getenv("AT_USERNAME") == "sandbox" or not sender_id:
        response = sms.send(body, [to_phone])
    else:
        response = sms.send(body, [to_phone], sender_id=sender_id)

    logger.info("Africa's Talking response: %s", response)

    # The SDK doesn't raise when AT rejects a recipient — it returns a
    # response saying so. Check it, or "sent" would be a lie.
    recipients = (response or {}).get("SMSMessageData", {}).get("Recipients", [])
    accepted = [r for r in recipients if r.get("statusCode") in _ACCEPTED_CODES]
    if not accepted:
        raise RuntimeError(f"Africa's Talking did not accept the message: {response}")


def send_confession_link(to_phone: str, confession_id: str) -> None:
    base_url = os.getenv("APP_BASE_URL", "http://localhost:5173")
    _send(f"Someone sent you a confession. {base_url}/r/{confession_id}", to_phone)


def send_reminder(to_phone: str, confession_id: str) -> None:
    base_url = os.getenv("APP_BASE_URL", "http://localhost:5173")
    _send(f"Still waiting on you. {base_url}/r/{confession_id}", to_phone)


def send_reply_alert(to_phone: str, confession_id: str) -> None:
    # Link only, never the reply text: an SMS isn't a private channel.
    base_url = os.getenv("APP_BASE_URL", "http://localhost:5173")
    _send(f"commit.: they replied. See it here: {base_url}/status?id={confession_id}", to_phone)
