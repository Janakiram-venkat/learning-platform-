"""Read-only aggregations behind the /admin dashboard.

Student progress lives in one JSON blob per user (`users.progress`), owned by
the frontend. Rather than teach the database its shape, the admin views load the
users and fold the blobs in Python — the cohort is small enough that this is
cheaper than the migration a normalised schema would cost.

get_stats() is the exception: those headline numbers are now computed with SQL
COUNT / SUM aggregates so they don't require loading every progress blob.
"""
from datetime import datetime, timedelta

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.models.feedback import Feedback
from app.models.user import User
from app.services import course_service

# Progress keys we summarise per user. See frontend/src/lib/progress/keys.js.
_COMPLETION_KEYS = {
    "lessons_completed": "completedLessons",
    "assignments_completed": "completedAssignments",
    "projects_completed": "completedProjects",
    "labs_completed": "completedLabs",
}


def _count(progress: dict, key: str) -> int:
    value = (progress or {}).get(key)
    return len(value) if isinstance(value, (list, dict)) else 0


def _xp(progress: dict) -> int:
    value = (progress or {}).get("totalXP")
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def _summarise(user: User) -> dict:
    progress = user.progress or {}
    summary = {name: _count(progress, key) for name, key in _COMPLETION_KEYS.items()}
    summary["total_xp"] = _xp(progress)
    summary["badges"] = _count(progress, "earnedBadges")
    return summary


def _has_started(user: User) -> bool:
    """True once the student has completed anything at all."""
    summary = _summarise(user)
    return summary["total_xp"] > 0 or any(
        summary[name] for name in _COMPLETION_KEYS
    )


def list_users(db: Session, search: str | None = None, limit: int = 200) -> list[dict]:
    """Users (newest first) with their progress folded into a flat row."""
    query = db.query(User)
    if search:
        pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(User.email).like(pattern) | func.lower(User.name).like(pattern)
        )
    users = query.order_by(User.created_at.desc()).limit(max(1, min(limit, 500))).all()

    return [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "interests": u.interests or [],
            "is_admin": bool(u.is_admin),
            "has_password": u.password_hash is not None,
            "created_at": u.created_at,
            **_summarise(u),
        }
        for u in users
    ]


def get_stats(db: Session) -> dict:
    """Headline totals across every account plus the feedback table.

    Uses SQL aggregates rather than loading every user row into Python so this
    stays fast as the user base grows.
    """
    week_ago = datetime.utcnow() - timedelta(days=7)

    # --- User counts via SQL aggregates (no full table scan) ----------------
    total_users = db.query(func.count(User.id)).scalar() or 0
    admin_users = db.query(func.count(User.id)).filter(User.is_admin.is_(True)).scalar() or 0
    google_users = db.query(func.count(User.id)).filter(User.password_hash.is_(None)).scalar() or 0
    new_users_7d = (
        db.query(func.count(User.id)).filter(User.created_at >= week_ago).scalar() or 0
    )

    # "Active" still requires reading the progress JSON blob (no normalised
    # columns yet), so we keep the Python fold only for that metric and the
    # XP / completion totals. The query is bounded by total_users — acceptable
    # until progress is normalised.
    users = db.query(User).all()
    totals = {name: 0 for name in _COMPLETION_KEYS}
    total_xp = 0
    active_users_7d = 0
    for u in users:
        summary = _summarise(u)
        total_xp += summary["total_xp"]
        for name in totals:
            totals[name] += summary[name]
        if _has_started(u):
            active_users_7d += 1

    # --- Feedback aggregates -----------------------------------------------
    feedback_count = db.query(func.count(Feedback.id)).scalar() or 0
    average_rating = db.query(func.avg(Feedback.rating)).scalar()

    return {
        "total_users": total_users,
        "admin_users": admin_users,
        "google_users": google_users,
        "new_users_7d": new_users_7d,
        "active_users_7d": active_users_7d,
        "total_xp": total_xp,
        **totals,
        "feedback_count": feedback_count,
        "average_rating": round(float(average_rating), 2) if average_rating is not None else None,
    }


def _course_keys() -> dict[str, set[str]]:
    """Per course, the progress ids that belong to it and nothing else.

    Lesson ids, lab keys and game-step keys are all flat strings in the progress
    document, and a couple of them repeat across courses (two courses can each
    have an "intro" lesson). Any id claimed by more than one course is dropped,
    so a learner is only ever counted for a course we can attribute with
    certainty.
    """
    claims: dict[str, set[str]] = {}

    for course in course_service.get_all_courses():
        course_id = course.get("courseId") or course.get("id")
        if not course_id:
            continue
        keys = claims.setdefault(course_id, set())
        is_game = course.get("format") == "game"

        for stub in course.get("modules", []):
            module_id = stub.get("moduleId") or stub.get("id")
            filename = stub.get("file") or (f"module{module_id}" if module_id else None)
            if not filename:
                continue
            key = filename[:-5] if filename.endswith(".json") else filename
            module = course_service.get_content(course_id, "module", key)
            if not isinstance(module, dict):
                continue

            for lesson in module.get("lessons", []):
                if lesson.get("lessonId"):
                    keys.add(lesson["lessonId"])
            if is_game:
                steps = module.get("steps") or []
                keys.update(f"module{module_id}:{i}" for i in range(len(steps)))
            # Labs are already course-scoped, e.g. "ai-module1".
            keys.add(f"{course_id}-module{module_id}")

    # Drop ids claimed by more than one course.
    seen: dict[str, int] = {}
    for keys in claims.values():
        for key in keys:
            seen[key] = seen.get(key, 0) + 1
    return {cid: {k for k in keys if seen[k] == 1} for cid, keys in claims.items()}


def course_usage(db: Session) -> list[dict]:
    """Learners and completed items per course, busiest first."""
    keys_by_course = _course_keys()
    titles = {
        (c.get("courseId") or c.get("id")): c.get("title") or (c.get("courseId") or "")
        for c in course_service.get_all_courses()
    }

    rows = []
    users = db.query(User).all()
    for course_id, keys in keys_by_course.items():
        learners = items = 0
        for u in users:
            progress = u.progress or {}
            done = set()
            for key in ("completedLessons", "completedLabs", "completedGameSteps"):
                value = progress.get(key)
                if isinstance(value, list):
                    done.update(v for v in value if isinstance(v, str))
            hits = len(done & keys)
            if hits:
                learners += 1
                items += hits
        rows.append(
            {
                "course_id": course_id,
                "title": titles.get(course_id, course_id),
                "learners": learners,
                "items_completed": items,
            }
        )

    rows.sort(key=lambda r: (-r["learners"], r["title"]))
    return rows


def list_feedback(db: Session, limit: int = 100) -> list[Feedback]:
    return (
        db.query(Feedback)
        .order_by(Feedback.created_at.desc())
        .limit(max(1, min(limit, 500)))
        .all()
    )


def delete_user(db: Session, user_id: int) -> User | None:
    """Delete a student account. Returns None if there's no such user."""
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        return None
    db.delete(user)
    db.commit()
    return user
