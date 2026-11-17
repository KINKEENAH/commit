import logging
import os
import requests

logger = logging.getLogger("uvicorn.error")

ARKESEL_URL = "https://sms.arkesel.com/api/v2/sms/send"


def _send(body: str, to_phone: str) -> None:
    api_key = os.getenv("ARKESEL_API_KEY")
    sender = (os.getenv("ARKESEL_SENDER_ID") or "").strip()
    if not api_key or not sender:
        raise RuntimeError("ARKESEL_API_KEY and ARKESEL_SENDER_ID must be set")

    try:
        res = requests.post(
            ARKESEL_URL,
            headers={"api-key": api_key, "Content-Type": "application/json"},
            json={"sender": sender, "message": body, "recipients": [to_phone]},
            timeout=15,
        )
    except requests.RequestException as e:
        raise RuntimeError(f"Could not reach Arkesel: {e}") from e

    logger.info("Arkesel response %s: %s", res.status_code, res.text)

    try:
        data = res.json()
    except ValueError:
        data = {}

    if res.status_code != 200 or data.get("status") != "success":
        raise RuntimeError(f"Arkesel did not accept the message ({res.status_code}): {res.text}")

    # Rejected numbers come back as a separate entry in "data".
    for item in data.get("data", []):
        if isinstance(item, dict) and item.get("invalid numbers"):
            raise RuntimeError(f"Arkesel rejected the number: {item['invalid numbers']}")


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