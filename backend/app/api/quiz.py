from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.models.user import User
from app.schemas.quiz_schema import QuizRequest, QuizResponse
from app.services import quiz_service

router = APIRouter()


@router.post("/courses/{course_id}/quiz/submit", response_model=QuizResponse)
def submit_quiz(
    course_id: str,
    request: QuizRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Grade a quiz and persist the attempt for analytics.

    The result is returned immediately; the stored row lets admins later see
    which lessons students struggle with and how scores trend over time.
    """
    result = quiz_service.submit_quiz(
        course_id,
        request.lessonId,
        request.answers,
        db=db,
        user_id=current_user.id,
    )
    if "error" in result:
        return QuizResponse(score=0, total=0, results=[])
    return QuizResponse(
        score=result["score"],
        total=result["total"],
        results=result.get("results", []),
    )
