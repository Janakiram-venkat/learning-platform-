import os
from pathlib import Path
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# Ensure .env is loaded regardless of import order.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

# Reuse one transport instance across verifications.
_request = google_requests.Request()


def verify_google_token(token: str) -> dict:
    """Verify a Google ID token and return its claims.

    Raises ValueError if the token is invalid or not issued for our client.
    """
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise ValueError("GOOGLE_CLIENT_ID is not configured on the server.")

    # Validates signature, expiry, and audience (our client id).
    claims = id_token.verify_oauth2_token(token, _request, client_id)

    if not claims.get("email"):
        raise ValueError("Google token has no email claim.")
    if claims.get("email_verified") is False:
        raise ValueError("Google email is not verified.")

    return claims
