import json
import os
from pathlib import Path

# Base path for courses directory
COURSES_DIR = Path(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../courses")))

def get_all_courses():
    courses = []
    if not COURSES_DIR.exists():
        return courses
    
    for course_dir in COURSES_DIR.iterdir():
        if course_dir.is_dir():
            course_file = course_dir / "course.json"
            if course_file.exists():
                with open(course_file, 'r', encoding='utf-8') as f:
                    courses.append(json.load(f))
    return courses

def get_course_by_id(course_id: str):
    course_file = COURSES_DIR / course_id / "course.json"
    if course_file.exists():
        with open(course_file, 'r', encoding='utf-8') as f:
            course = json.load(f)
            populated_modules = []
            for m in course.get("modules", []):
                module_filename = m.get("file")
                if module_filename:
                    module_file = COURSES_DIR / course_id / module_filename
                    if module_file.exists():
                        try:
                            with open(module_file, 'r', encoding='utf-8') as mf:
                                m_data = json.load(mf)
                                populated_modules.append(m_data)
                                continue
                        except Exception as e:
                            print(f"Error loading module file {module_filename}: {e}")
                populated_modules.append(m)
            course["modules"] = populated_modules
            return course
    return None

def get_module_by_id(course_id: str, module_id: str):
    # module_id might be "module1", we look for "module1.json"
    module_file = COURSES_DIR / course_id / f"{module_id}.json"
    if module_file.exists():
        with open(module_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def get_lesson_by_id(course_id: str, lesson_id: str):
    lesson_file = COURSES_DIR / course_id / "lessons" / f"{lesson_id}.json"
    if lesson_file.exists():
        with open(lesson_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def get_assignment_by_id(course_id: str, module_id: str):
    # module_id is e.g. "module1"; assignments live in courses/<course>/assignments/.
    assignment_file = COURSES_DIR / course_id / "assignments" / f"{module_id}.json"
    if assignment_file.exists():
        with open(assignment_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def get_project_by_id(course_id: str, module_id: str):
    # module_id is e.g. "module1"; mini-projects live in courses/<course>/projects/.
    project_file = COURSES_DIR / course_id / "projects" / f"{module_id}.json"
    if project_file.exists():
        with open(project_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None
