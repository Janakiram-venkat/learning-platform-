"""Loads course content from the JSON files under `backend/courses/`.

Everything a course is made of — modules, lessons, assignments, projects and
labs — is a JSON file on disk, addressed by `(course_id, kind, key)`. There used
to be one hand-written getter per kind, all identical except for the subfolder
name; they're now a single `get_content` driven by `KIND_DIRS`, so adding a new
content type is one entry in that map instead of an edit in five places.

Content is immutable between deploys, so parsed files are cached and only
re-read when their mtime changes.
"""

import json
import os
import re
from pathlib import Path

COURSES_DIR = Path(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../courses")))

# Content kind -> subfolder inside `courses/<course_id>/`. Modules sit at the
# course root (e.g. `courses/python/module1.json`), hence the empty string.
KIND_DIRS = {
    "module": "",
    "lesson": "lessons",
    "assignment": "assignments",
    "project": "projects",
    "lab": "labs",
}

# course ids and content keys land here straight from the URL path, so they're
# restricted to a safe character set — this is what stops `../` traversal.
_SAFE_ID = re.compile(r"^[A-Za-z0-9_-]+$")

# path -> (mtime, parsed json)
_cache: dict[Path, tuple[float, object]] = {}


def _load_json(path: Path):
    """Read + parse a JSON file, caching the result until its mtime changes.

    Returns None if the file is missing or unparseable — callers turn that into
    a 404 rather than a 500.
    """
    try:
        mtime = path.stat().st_mtime
    except OSError:
        _cache.pop(path, None)
        return None

    cached = _cache.get(path)
    if cached is not None and cached[0] == mtime:
        return cached[1]

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        print(f"Error loading {path}: {e}")
        return None

    _cache[path] = (mtime, data)
    return data


def _content_path(course_id: str, kind: str, key: str) -> Path | None:
    """Resolve `(course_id, kind, key)` to a file path, or None if invalid.

    Rejects unknown kinds and any id that isn't a plain slug, so a crafted
    request can't read outside `COURSES_DIR`.
    """
    if kind not in KIND_DIRS:
        return None
    if not _SAFE_ID.match(course_id or "") or not _SAFE_ID.match(key or ""):
        return None

    subdir = KIND_DIRS[kind]
    base = COURSES_DIR / course_id
    path = (base / subdir / f"{key}.json") if subdir else (base / f"{key}.json")

    # Belt-and-braces: the resolved path must still sit inside COURSES_DIR.
    try:
        path.resolve().relative_to(COURSES_DIR.resolve())
    except ValueError:
        return None
    return path


def get_content(course_id: str, kind: str, key: str):
    """Return one piece of course content, or None if it doesn't exist.

    `kind` is one of KIND_DIRS; `key` is the filename without `.json`
    (e.g. a lessonId like "variables", or a module key like "module1").
    """
    path = _content_path(course_id, kind, key)
    return _load_json(path) if path else None


def get_all_courses():
    """Every course's `course.json`, for the course picker."""
    courses = []
    if not COURSES_DIR.exists():
        return courses

    for course_dir in sorted(COURSES_DIR.iterdir()):
        if not course_dir.is_dir():
            continue
        course = _load_json(course_dir / "course.json")
        if course is not None:
            courses.append(course)
    return courses


def get_course_by_id(course_id: str):
    """A course with its module stubs replaced by the full module documents.

    `course.json` lists modules as `{ id, title, file }`; each `file` is loaded
    and substituted in. Module files that are missing or broken fall back to the
    stub so the rest of the course still renders.
    """
    if not _SAFE_ID.match(course_id or ""):
        return None

    course = _load_json(COURSES_DIR / course_id / "course.json")
    if course is None:
        return None

    # Copy before mutating: `_load_json` hands back the cached object, and we
    # must not write the populated modules back into the cache.
    course = dict(course)

    populated = []
    for stub in course.get("modules", []):
        filename = stub.get("file")
        module = None
        if filename:
            key = filename[:-5] if filename.endswith(".json") else filename
            module = get_content(course_id, "module", key)
        populated.append(module if module is not None else stub)

    course["modules"] = populated
    return course


def public_view(kind: str, data):
    """Strip anything the browser shouldn't see before a document is served.

    Lesson quizzes are graded server-side (`quiz_service`), so the correct
    `answer` index must not travel with the lesson — otherwise the grading
    round-trip is theatre. The authored `explain` text stays, since it's only
    rendered after the student has answered.

    Returns a copy; the cached document is never mutated.
    """
    if kind != "lesson" or not isinstance(data, dict) or "quiz" not in data:
        return data

    public = dict(data)
    public["quiz"] = [
        {k: v for k, v in q.items() if k != "answer"} if isinstance(q, dict) else q
        for q in data.get("quiz") or []
    ]
    return public


# --- Backwards-compatible aliases -------------------------------------------
# The old per-kind getters. Kept as one-liners so existing callers keep working;
# new code should call `get_content` directly.

def get_module_by_id(course_id: str, module_id: str):
    return get_content(course_id, "module", module_id)


def get_lesson_by_id(course_id: str, lesson_id: str):
    return get_content(course_id, "lesson", lesson_id)


def get_assignment_by_id(course_id: str, module_id: str):
    return get_content(course_id, "assignment", module_id)


def get_project_by_id(course_id: str, module_id: str):
    return get_content(course_id, "project", module_id)


def get_lab_by_id(course_id: str, module_id: str):
    return get_content(course_id, "lab", module_id)
