"""Shared rate-limiter instance.

Lives in its own module so routers can import it without creating a circular
dependency with app.main (which imports the routers).

Three layers of limits, all counted per client:

  * application limit — one budget across every undecorated route, so a
    single client can't hammer the API by spreading requests over many URLs.
  * default limit — per route (key_style="endpoint", so /lessons/intro and
    /lessons/loops share one bucket instead of each getting their own).
  * explicit @limiter.limit(...) — tighter caps on sensitive routes (sign-in,
    password change, feedback). A decorated route uses only its own limit.

A "client" is the signed-in user when the request carries a valid JWT, and the
caller's IP otherwise. Keying on the user means a whole classroom behind one
school NAT doesn't share a single budget. Sign-in routes pass key_func=
client_ip explicitly so password guessing is always capped per IP.

Environment:
  RATELIMIT_STORAGE_URI  where counters live. Defaults to memory://, which is
                         per-process — fine for one instance. Once you run
                         several workers or instances, point this at Redis
                         (redis://host:6379, needs `pip install redis`) so they
                         share counts. If Redis becomes unreachable the limiter
                         falls back to in-memory rather than failing requests.
  CLIENT_IP_HEADER       header holding the real client IP when behind a proxy.
                         On Render set it to True-Client-IP; without it every
                         anonymous user looks like Render's proxy and they all
                         share one bucket. Leave unset locally. Only set it when
                         the app is reachable solely through that proxy, or
                         clients can forge the header.
  RATELIMIT_ENABLED      set to false to switch limiting off (e.g. load tests).
"""
import os
import time

import jwt
from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.security import JWT_ALGORITHM, JWT_SECRET

APPLICATION_LIMIT = os.getenv("RATELIMIT_APPLICATION", "300/minute")
DEFAULT_LIMIT = os.getenv("RATELIMIT_DEFAULT", "120/minute")

_CLIENT_IP_HEADER = os.getenv("CLIENT_IP_HEADER", "").strip()


def client_ip(request: Request) -> str:
    if _CLIENT_IP_HEADER:
        forwarded = request.headers.get(_CLIENT_IP_HEADER, "")
        # A header like X-Forwarded-For can hold a chain; the client is first.
        ip = forwarded.split(",")[0].strip()
        if ip:
            return ip
    return get_remote_address(request)


def client_key(request: Request) -> str:
    """Rate-limit key: the user id for a valid JWT, else the client IP.

    Only the signature is checked here (no DB hit) — a revoked-but-unexpired
    token still keys to its own user, which is fine for counting.
    """
    auth = request.headers.get("authorization", "")
    if auth[:7].lower() == "bearer ":
        try:
            payload = jwt.decode(auth[7:], JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return f"user:{payload['sub']}"
        except (jwt.PyJWTError, KeyError):
            pass
    return f"ip:{client_ip(request)}"


limiter = Limiter(
    key_func=client_key,
    application_limits=[APPLICATION_LIMIT],
    default_limits=[DEFAULT_LIMIT],
    key_style="endpoint",
    storage_uri=os.getenv("RATELIMIT_STORAGE_URI", "memory://"),
    in_memory_fallback_enabled=True,
    enabled=os.getenv("RATELIMIT_ENABLED", "true").lower() != "false",
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """429 in the same {"detail": ...} shape as every other API error, so the
    frontend's `err.response.data.detail` shows a real message, plus a
    Retry-After header telling the client how long to wait."""
    headers = {}
    current = getattr(request.state, "view_rate_limit", None)
    if current is not None:
        try:
            reset_at, _ = limiter.limiter.get_window_stats(current[0], *current[1])
            headers["Retry-After"] = str(max(1, int(reset_at - time.time())))
        except Exception:  # headers are best-effort; the 429 itself matters
            pass
    return JSONResponse(
        {"detail": "Too many requests — please wait a moment and try again."},
        status_code=429,
        headers=headers,
    )
