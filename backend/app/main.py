import os
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from app.core.limiter import limiter  # noqa: F401 — re-exported for routers that still use it
from app.api import admin, courses, lessons, quiz, users, feedback
from app.core.security import get_current_user
from app.db import Base, engine
from app.models import user as _user_model          # noqa: F401
from app.models import feedback as _feedback_model  # noqa: F401
from app.models import quiz_attempt as _quiz_attempt_model  # noqa: F401

# ---------------------------------------------------------------------------
# Database — create missing tables and columns on startup.
# create_all only creates missing *tables*, never missing columns, so columns
# added after a table already exists need a nudge.  There's no migration tool
# in this project yet; when a second batch of these shows up that's the signal
# to add Alembic rather than extend this list.
# ---------------------------------------------------------------------------
Base.metadata.create_all(bind=engine)

with engine.begin() as conn:
    conn.execute(
        text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE")
    )
    conn.execute(
        text("ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0")
    )

# Rate limiter is instantiated in app.core.limiter and imported above.
# It's attached to app.state so slowapi can find it.

app = FastAPI(title="Student Coding Platform API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # 429 on rate-limit breaches

# Allowed frontend origins. Set CORS_ORIGINS on Render to your Vercel URL
# (comma-separated for multiple). Falls back to local dev origins.
_default_origins = "http://localhost:5173,http://localhost:3000"
allowed_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", _default_origins).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Course content is for signed-in students only. The dependency sits on the
# router mount rather than on each route so a new content endpoint is gated by
# default — the frontend guard in RequireAuth is convenience, this is the real
# check. Anonymous callers get a 401 from HTTPBearer.
_signed_in = [Depends(get_current_user)]

app.include_router(courses.router, prefix="/api", tags=["Courses"], dependencies=_signed_in)
app.include_router(lessons.router, prefix="/api", tags=["Lessons"], dependencies=_signed_in)
app.include_router(quiz.router, prefix="/api", tags=["Quiz"], dependencies=_signed_in)
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(feedback.router, prefix="/api", tags=["Feedback"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Student Coding Platform API"}
