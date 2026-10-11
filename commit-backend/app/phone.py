import re


def normalize_ghana_phone(phone: str) -> str:
    """Converts a local-format Ghana number (0551234567) to E.164
    (+233551234567) — the format Twilio requires (error 21211 otherwise).
    Already-E.164 numbers pass through unchanged.

    This only handles Ghana numbers. If the app ever needs to support other
    countries, this needs a real phone-parsing library (e.g. phonenumbers)
    instead of a hand-written prefix check.
    """
    digits = re.sub(r"[^\d+]", "", phone)
    if digits.startswith("+"):
        return digits
    if digits.startswith("233"):
        return "+" + digits
    if digits.startswith("0"):
        return "+233" + digits[1:]
    return "+233" + digits
