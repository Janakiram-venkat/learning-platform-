#!/usr/bin/env python
"""Validate every hand-authored course JSON file under `backend/courses/`.

Course content is written by hand, and until now the only thing checking it was
whether the browser happened to crash. A missing `answer`, a lessonId that
doesn't match its filename, or a module `file` that points nowhere all showed up
as a blank screen at runtime. This catches them at author time instead.

Usage:
    python backend/scripts/validate_courses.py          # report + exit 1 on errors
    python backend/scripts/validate_courses.py --warn   # report, always exit 0

Add it to CI once the existing backlog is clean.
"""

import argparse
import json
import sys
from pathlib import Path

COURSES_DIR = Path(__file__).resolve().parent.parent / "courses"

# Subfolders of a course that hold per-module documents, and the id field each
# document is expected to carry. Mirrors course_service.KIND_DIRS.
MODULE_KINDS = {
    "assignments": "moduleId",
    "projects": "moduleId",
    "labs": "labId",
}


class Report:
    """Collects problems, tagged with the file they came from."""

    def __init__(self):
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, path: Path, message: str):
        self.errors.append(f"{self._rel(path)}: {message}")

    def warn(self, path: Path, message: str):
        self.warnings.append(f"{self._rel(path)}: {message}")

    @staticmethod
    def _rel(path: Path) -> str:
        try:
            return str(path.relative_to(COURSES_DIR.parent))
        except ValueError:
            return str(path)


def load(path: Path, report: Report):
    """Parse a JSON file, recording a parse/read failure instead of raising."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        report.error(path, f"invalid JSON — {e}")
    except OSError as e:
        report.error(path, f"could not read — {e}")
    return None


def require(data: dict, keys: list[str], path: Path, report: Report, where: str = ""):
    """Record an error for each missing or empty required key."""
    prefix = f"{where}: " if where else ""
    for key in keys:
        if data.get(key) in (None, "", [], {}):
            report.error(path, f"{prefix}missing required field '{key}'")


def check_mcq(q: dict, path: Path, report: Report, label: str):
    """One multiple-choice question.

    It needs a stem, at least two options, and an `answer` that actually indexes
    into those options — an out-of-range answer makes the question unanswerable,
    which is the failure mode most likely to reach a student.
    """
    if not (q.get("question") or q.get("prompt")):
        report.error(path, f"{label}: missing 'question'/'prompt' text")

    options = q.get("options")
    if not isinstance(options, list) or len(options) < 2:
        report.error(path, f"{label}: needs at least 2 options")
        return

    answer = q.get("answer")
    if not isinstance(answer, int) or isinstance(answer, bool):
        report.error(path, f"{label}: 'answer' must be an integer index")
    elif not 0 <= answer < len(options):
        report.error(
            path,
            f"{label}: 'answer' is {answer} but there are only {len(options)} options",
        )


def check_quiz(questions, path: Path, report: Report, where: str):
    """Validate a list of multiple-choice questions (lesson + lab quizzes)."""
    if not isinstance(questions, list):
        report.error(path, f"{where}: expected a list of questions")
        return

    for i, q in enumerate(questions):
        label = f"{where}[{i}]"
        if not isinstance(q, dict):
            report.error(path, f"{label}: expected an object")
            continue
        check_mcq(q, path, report, label)
        if not q.get("explain"):
            report.warn(path, f"{label}: no 'explain' text — students see a generic message")


def check_rounds(rounds, path: Path, report: Report):
    """Validate an arcade assignment's rounds.

    Rounds aren't all multiple-choice: `concept`/`predict`/`bug` are MCQs,
    `match` pairs up two columns, and `order` asks the student to sequence
    lines of code. Each shape needs different fields, and a round whose `type`
    the runner doesn't recognise renders as a dead end.
    """
    if not isinstance(rounds, list):
        report.error(path, "'rounds' must be a list")
        return

    mcq_types = {"concept", "predict", "bug"}

    for i, r in enumerate(rounds):
        label = f"rounds[{i}]"
        if not isinstance(r, dict):
            report.error(path, f"{label}: expected an object")
            continue

        kind = r.get("type")
        if not r.get("prompt"):
            report.error(path, f"{label}: missing 'prompt'")

        if kind in mcq_types:
            check_mcq(r, path, report, label)
        elif kind == "match":
            pairs = r.get("pairs")
            if not isinstance(pairs, list) or len(pairs) < 2:
                report.error(path, f"{label}: 'match' needs at least 2 pairs")
            else:
                for j, pair in enumerate(pairs):
                    if not (isinstance(pair, dict) and pair.get("left") and pair.get("right")):
                        report.error(path, f"{label}.pairs[{j}]: needs both 'left' and 'right'")
        elif kind == "order":
            solution = r.get("solution")
            if not isinstance(solution, list) or len(solution) < 2:
                report.error(path, f"{label}: 'order' needs a 'solution' of at least 2 lines")
        else:
            report.error(path, f"{label}: unknown round type '{kind}'")

        if not r.get("explain"):
            report.warn(path, f"{label}: no 'explain' text")


def check_lessons_dir(course_dir: Path, referenced: set[str], report: Report):
    """Sweep the lessons folder for files no module points at.

    `check_lesson` only looks at lessons a module references, so a file that is
    broken *and* orphaned would otherwise pass silently — and an orphan is
    usually a typo in the module's lesson list rather than dead content.
    """
    lessons_dir = course_dir / "lessons"
    if not lessons_dir.is_dir():
        return

    for path in sorted(lessons_dir.glob("*.json")):
        if path.stem in referenced:
            continue
        # load() records a parse error if there is one; an orphan that parses
        # fine is only worth a warning.
        if load(path, report) is not None:
            report.warn(path, "not referenced by any module — is it orphaned?")


def check_lesson(course_dir: Path, lesson_id: str, report: Report):
    """A lesson referenced by a module must exist and be internally consistent."""
    path = course_dir / "lessons" / f"{lesson_id}.json"
    if not path.exists():
        report.error(course_dir / "lessons", f"lesson '{lesson_id}' referenced but no such file")
        return

    lesson = load(path, report)
    if lesson is None:
        return

    require(lesson, ["lessonId", "title", "content"], path, report)

    if lesson.get("lessonId") != lesson_id:
        report.error(
            path,
            f"lessonId is '{lesson.get('lessonId')}' but the filename says '{lesson_id}'",
        )

    if "quiz" in lesson:
        check_quiz(lesson["quiz"], path, report, "quiz")


def check_module_doc(path: Path, course_dir: Path, report: Report, referenced: set[str]):
    """A module document: its lesson list must resolve to real lesson files.

    Every lessonId it points at is added to `referenced`, so the caller can tell
    afterwards which lesson files nothing links to.
    """
    module = load(path, report)
    if module is None:
        return

    if module.get("moduleId") is None and module.get("id") is None:
        report.error(path, "missing 'moduleId'")

    # Lesson-shaped modules (python, ai) list lessons; game-shaped ones list steps.
    for i, lesson_stub in enumerate(module.get("lessons") or []):
        lesson_id = lesson_stub.get("lessonId")
        if not lesson_id:
            report.error(path, f"lessons[{i}]: missing 'lessonId'")
            continue
        referenced.add(lesson_id)
        check_lesson(course_dir, lesson_id, report)

    for i, step in enumerate(module.get("steps") or []):
        require(step, ["title"], path, report, f"steps[{i}]")


def check_module_kind_files(course_dir: Path, folder: str, id_field: str, report: Report):
    """Assignments / projects / labs: light per-kind structural checks."""
    kind_dir = course_dir / folder
    if not kind_dir.is_dir():
        return

    for path in sorted(kind_dir.glob("*.json")):
        data = load(path, report)
        if data is None:
            continue

        require(data, [id_field, "title"], path, report)

        if "rounds" in data:
            check_rounds(data["rounds"], path, report)

        # Mini-projects are graded by running their tests, so they need some.
        if folder == "projects" and not data.get("tests"):
            report.warn(path, "project has no 'tests' — nothing to grade against")

        # Labs are a list of typed stages; an untyped stage renders as nothing.
        for i, stage in enumerate(data.get("stages") or []):
            if not stage.get("type"):
                report.error(path, f"stages[{i}]: missing 'type'")


def check_course(course_dir: Path, report: Report):
    """One course folder: course.json plus everything it points at."""
    course_file = course_dir / "course.json"
    if not course_file.exists():
        report.error(course_dir, "no course.json")
        return

    course = load(course_file, report)
    if course is None:
        return

    require(course, ["courseId", "title", "modules"], course_file, report)

    referenced: set[str] = set()

    if course.get("courseId") != course_dir.name:
        report.error(
            course_file,
            f"courseId is '{course.get('courseId')}' but the folder is '{course_dir.name}'",
        )

    for i, stub in enumerate(course.get("modules") or []):
        filename = stub.get("file")
        if filename:
            module_path = course_dir / filename
            if module_path.exists():
                check_module_doc(module_path, course_dir, report, referenced)
            else:
                report.error(course_file, f"modules[{i}]: '{filename}' does not exist")
        elif stub.get("moduleId") is not None:
            # Game-format courses inline their module stubs and keep the real
            # document in module<N>.json alongside course.json.
            #
            # `stepCount: 0` is the roadmap convention: the module is listed so
            # students can see what's coming, and the course page renders it as
            # a locked "Coming soon" card. Those have no document yet by design.
            if not stub.get("stepCount"):
                continue

            module_path = course_dir / f"module{stub['moduleId']}.json"
            if module_path.exists():
                check_module_doc(module_path, course_dir, report, referenced)
            else:
                report.error(
                    course_file,
                    f"modules[{i}]: stepCount is {stub['stepCount']} but {module_path.name} is missing",
                )
        else:
            report.error(course_file, f"modules[{i}]: needs either 'file' or 'moduleId'")

    check_lessons_dir(course_dir, referenced, report)

    for folder, id_field in MODULE_KINDS.items():
        check_module_kind_files(course_dir, folder, id_field, report)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--warn",
        action="store_true",
        help="report problems but always exit 0 (use while clearing the backlog)",
    )
    args = parser.parse_args()

    if not COURSES_DIR.is_dir():
        print(f"No courses directory at {COURSES_DIR}")
        return 1

    report = Report()
    course_dirs = sorted(d for d in COURSES_DIR.iterdir() if d.is_dir())
    for course_dir in course_dirs:
        check_course(course_dir, report)

    for line in report.warnings:
        print(f"  warn   {line}")
    for line in report.errors:
        print(f"  ERROR  {line}")

    print(
        f"\nChecked {len(course_dirs)} course(s): "
        f"{len(report.errors)} error(s), {len(report.warnings)} warning(s)."
    )

    if report.errors and not args.warn:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
