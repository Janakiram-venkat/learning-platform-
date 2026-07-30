import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.api import admin, courses, lessons, quiz, users, feedback
from app.db import Base, engine
from app.models import user as _user_model  # noqa: F401  (register model with Base)
from app.models import feedback as _feedback_model  # noqa: F401  (register model with Base)

# Create tables on startup if they don't already exist.
Base.metadata.create_all(bind=engine)

# create_all only creates missing *tables*, never missing columns, so columns
# added after a table already exists need a nudge. There's no migration tool in
# this project yet; when a second one of these shows up, that's the signal to
# add Alembic rather than extend this list.
with engine.begin() as conn:
    conn.execute(
        text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE")
    )

app = FastAPI(title="Student Coding Platform API")

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

app.include_router(courses.router, prefix="/api", tags=["Courses"])
app.include_router(lessons.router, prefix="/api", tags=["Lessons"])
# NOTE: the old /run-python endpoint is gone. Python now runs entirely in the
# browser (Pyodide in a Web Worker) — see frontend/src/services/pyodide.js.
# The server-side runner shelled out to `python -c <user code>` with no sandbox,
# so it was removed rather than left mounted.
app.include_router(quiz.router, prefix="/api", tags=["Quiz"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(feedback.router, prefix="/api", tags=["Feedback"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Student Coding Platform API"}
