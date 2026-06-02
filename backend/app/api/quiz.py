from fastapi import APIRouter
from app.schemas.quiz_schema import QuizRequest, QuizResponse
from app.services import quiz_service

router = APIRouter()

@router.post("/courses/{course_id}/quiz/submit", response_model=QuizResponse)
def submit_quiz(course_id: str, request: QuizRequest):
    result = quiz_service.submit_quiz(course_id, request.lessonId, request.answers)
    if "error" in result:
        return QuizResponse(score=0, total=0)
    return QuizResponse(score=result["score"], total=result["total"])
