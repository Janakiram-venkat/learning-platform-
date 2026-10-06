from fastapi import APIRouter
from app.api.courses import _content_or_404

router = APIRouter()


@router.get("/courses/{course_id}/lessons/{lesson_id}")
def get_lesson(course_id: str, lesson_id: str):
    """Legacy alias for `/courses/{course_id}/content/lesson/{lesson_id}`.

    Goes through the same handler, so the quiz answer keys are stripped here
    too (see `course_service.public_view`).
    """
    return _content_or_404(course_id, "lesson", lesson_id)
