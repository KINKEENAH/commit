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
    # The sandbox username ("sandbox") can't use a custom sender id at all
    # — only a real app can, once "commit." is registered under
    # SMS > Alphanumerics in the dashboard. Passing one while on sandbox
    # just errors, so it's left out entirely in that case.
    if os.getenv("AT_USERNAME") == "sandbox":
        response = sms.send(body, [to_phone])
    else:
        sender_id = os.getenv("AT_SENDER_ID", "commit.")
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
