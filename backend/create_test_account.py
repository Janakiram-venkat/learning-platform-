"""One-off script: create a fully-unlocked TEST account for QA.

Run from the backend/ directory with the project venv:
    venv/Scripts/python create_test_account.py

It scans courses/ to gather every lesson/assignment/lab/project id and stores
them in the account's progress document so all chapters are unlocked. Safe to
re-run: it updates the existing test user in place. Delete later with the
companion query printed at the end.
"""
import json
import sys
from pathlib import Path

# Make `app` importable when run from backend/.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402
from app.core.security import hash_password  # noqa: E402

# ---- Credentials (change here if you want) --------------------------------
EMAIL = "tester@pocketlab.dev"
NAME = "Test Account (QA)"
PASSWORD = "Test@1234"
INTERESTS = ["ai", "game-dev", "math", "science"]

COURSES = Path(__file__).resolve().parent / "courses"


def load(path: Path) -> dict:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def gather_progress() -> dict:
    completed_lessons, completed_assignments = [], []
    completed_labs, completed_projects = [], []
    assignment_stars = {}

    for course_dir in sorted(COURSES.iterdir()):
        if not course_dir.is_dir():
            continue
        course_id = course_dir.name

        # Lessons come from each module<N>.json in course order.
        for mod_file in sorted(course_dir.glob("module*.json")):
            for lesson in load(mod_file).get("lessons", []):
                completed_lessons.append(lesson["lessonId"])

        # Assignments / labs / projects live in their own sub-folders.
        for a in sorted((course_dir / "assignments").glob("module*.json")):
            completed_assignments.append(a.stem)       # e.g. "module1"
            assignment_stars[a.stem] = 3
        for lab in sorted((course_dir / "labs").glob("module*.json")):
            completed_labs.append(f"{course_id}-{lab.stem}")  # e.g. "ai-module1"
        for proj in sorted((course_dir / "projects").glob("module*.json")):
            completed_projects.append(proj.stem)       # e.g. "module1"

    # De-dupe (lesson ids can repeat across courses; a Set unlocks either way).
    return {
        "totalXP": 9999,
        "xpClaimed": [],
        "earnedBadges": [],
        "feedbackAsked": [],
        "completedLessons": sorted(set(completed_lessons)),
        "completedAssignments": sorted(set(completed_assignments)),
        "assignmentStars": assignment_stars,
        "completedProjects": sorted(set(completed_projects)),
        "completedLabs": sorted(set(completed_labs)),
        "aiIdeas": [],
    }


def main() -> None:
    progress = gather_progress()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == EMAIL).first()
        if user is None:
            user = User(
                email=EMAIL,
                name=NAME,
                password_hash=hash_password(PASSWORD),
                interests=INTERESTS,
                progress=progress,
            )
            db.add(user)
            action = "Created"
        else:
            user.name = NAME
            user.password_hash = hash_password(PASSWORD)
            user.interests = INTERESTS
            user.progress = progress
            action = "Updated"
        db.commit()
        db.refresh(user)

        print(f"\n{action} test account (id={user.id})")
        print("-" * 44)
        print(f"  Email:    {EMAIL}")
        print(f"  Password: {PASSWORD}")
        print(f"  Lessons unlocked: {len(progress['completedLessons'])}")
        print(f"  Assignments done: {len(progress['completedAssignments'])}")
        print(f"  Labs done:        {len(progress['completedLabs'])}")
        print(f"  Projects done:    {len(progress['completedProjects'])}")
        print("-" * 44)
        print("To remove later, run in a Python shell (backend venv):")
        print("  from app.db import SessionLocal; from app.models.user import User")
        print(f"  db=SessionLocal(); u=db.query(User).filter(User.email=='{EMAIL}').first()")
        print("  db.delete(u); db.commit()")
    finally:
        db.close()


if __name__ == "__main__":
    main()
