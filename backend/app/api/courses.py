from fastapi import APIRouter, HTTPException
from app.services import course_service

router = APIRouter()

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

@router.get("/courses/{course_id}/modules/{module_id}")
def get_module(course_id: str, module_id: str):
    module = course_service.get_module_by_id(course_id, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return {"success": True, "data": module}

@router.get("/courses/{course_id}/assignments/{module_id}")
def get_assignment(course_id: str, module_id: str):
    assignment = course_service.get_assignment_by_id(course_id, module_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"success": True, "data": assignment}

@router.get("/courses/{course_id}/projects/{module_id}")
def get_project(course_id: str, module_id: str):
    project = course_service.get_project_by_id(course_id, module_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"success": True, "data": project}

@router.get("/courses/{course_id}/labs/{module_id}")
def get_lab(course_id: str, module_id: str):
    lab = course_service.get_lab_by_id(course_id, module_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    return {"success": True, "data": lab}
