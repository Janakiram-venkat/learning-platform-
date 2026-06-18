from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas.feedback_schema import FeedbackCreate, FeedbackResponse
from app.services import feedback_service

router = APIRouter()


@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(request: FeedbackCreate, db: Session = Depends(get_db)):
    """Save a student's star rating + optional comment."""
    return feedback_service.create_feedback(db, request)


@router.get("/feedback", response_model=list[FeedbackResponse])
def get_feedback(limit: int = 100, db: Session = Depends(get_db)):
    """List recent feedback (most recent first)."""
    return feedback_service.list_feedback(db, limit)
