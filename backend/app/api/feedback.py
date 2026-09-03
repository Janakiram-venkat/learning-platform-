from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.limiter import limiter
from app.core.security import get_current_admin
from app.db import get_db
from app.schemas.feedback_schema import FeedbackCreate, FeedbackResponse
from app.services import feedback_service

router = APIRouter()


@router.post("/feedback", response_model=FeedbackResponse)
@limiter.limit("5/minute")
def submit_feedback(request: Request, body: FeedbackCreate, db: Session = Depends(get_db)):
    """Save a student's star rating + optional comment.

    Rate-limited to 5 per minute per IP to prevent feedback spam.
    No authentication required — anonymous feedback is intentional, but
    the rate limit keeps bots from flooding the table.
    """
    return feedback_service.create_feedback(db, body)


@router.get(
    "/feedback",
    response_model=list[FeedbackResponse],
    dependencies=[Depends(get_current_admin)],
)
def get_feedback(limit: int = 100, db: Session = Depends(get_db)):
    """List recent feedback (most recent first). Admins only — the rows carry
    student email addresses and free-text comments."""
    return feedback_service.list_feedback(db, limit)
