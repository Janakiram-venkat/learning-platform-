from fastapi import APIRouter, HTTPException
from app.services import course_service

router = APIRouter()

@router.get("/courses/{course_id}/lessons/{lesson_id}")
def get_lesson(course_id: str, lesson_id: str):
    lesson = course_service.get_lesson_by_id(course_id, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return {"success": True, "data": lesson}
