from sqlalchemy.orm import Session
from app.models.feedback import Feedback
from app.schemas.feedback_schema import FeedbackCreate


def create_feedback(db: Session, data: FeedbackCreate) -> Feedback:
    feedback = Feedback(
        user_email=(data.user_email or "").strip().lower() or None,
        course_id=data.course_id,
        modules_completed=data.modules_completed,
        rating=data.rating,
        comment=(data.comment or "").strip() or None,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


def list_feedback(db: Session, limit: int = 100) -> list[Feedback]:
    return (
        db.query(Feedback)
        .order_by(Feedback.created_at.desc())
        .limit(limit)
        .all()
    )
