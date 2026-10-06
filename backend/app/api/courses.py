from fastapi import APIRouter, HTTPException
from app.services import course_service
from app.services.course_service import KIND_DIRS

router = APIRouter()


def _content_or_404(course_id: str, kind: str, key: str):
    """Fetch one content document or raise a 404 with a useful message."""
    if kind not in KIND_DIRS:
        raise HTTPException(status_code=404, detail=f"Unknown content type '{kind}'")
    data = course_service.get_content(course_id, kind, key)
    if data is None:
        raise HTTPException(status_code=404, detail=f"{kind.capitalize()} not found")
    return {"success": True, "data": course_service.public_view(kind, data)}


@router.get("/courses")
def get_courses():
    courses = course_service.get_all_courses()
    return {"success": True, "data": courses}


@router.get("/courses/{course_id}")
def get_course(course_id: str):
    course = course_service.get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"success": True, "data": course}


@router.get("/courses/{course_id}/content/{kind}/{key}")
def get_course_content(course_id: str, kind: str, key: str):
    """Fetch any piece of course content by kind.

    `kind` is one of the keys in `course_service.KIND_DIRS` (module, lesson,
    assignment, project, lab). A new content type needs no new route — add it
    to that map and it's served here.
    """
    return _content_or_404(course_id, kind, key)


# --- Legacy per-kind routes -------------------------------------------------
# Kept so older clients (and any bookmarked URLs) keep working. Each one just
# delegates to the generic handler above; new callers should use /content/.

@router.get("/courses/{course_id}/modules/{module_id}")
def get_module(course_id: str, module_id: str):
    return _content_or_404(course_id, "module", module_id)


@router.get("/courses/{course_id}/assignments/{module_id}")
def get_assignment(course_id: str, module_id: str):
    return _content_or_404(course_id, "assignment", module_id)


@router.get("/courses/{course_id}/projects/{module_id}")
def get_project(course_id: str, module_id: str):
    return _content_or_404(course_id, "project", module_id)


@router.get("/courses/{course_id}/labs/{module_id}")
def get_lab(course_id: str, module_id: str):
    return _content_or_404(course_id, "lab", module_id)
