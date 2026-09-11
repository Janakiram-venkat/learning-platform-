"""Contest rules: the time window, one entry per student, judging, leaderboard.

Every time check happens here against the server clock. The browser's
countdown is a convenience; a student whose laptop clock is wrong (or who
changes it) still can't save before the start or after the end.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.contest import Contest, ContestEntry
from app.models.user import User
from app.schemas.contest_schema import ContestWrite, as_utc

# An autosave fired a moment before the deadline can land a moment after it.
# Accept those rather than lose the student's last edits.
SAVE_GRACE = timedelta(seconds=30)


class ContestError(Exception):
    """A rule was broken. `status` is the HTTP code the API should answer with."""

    def __init__(self, status: int, detail: str):
        super().__init__(detail)
        self.status = status
        self.detail = detail


def now() -> datetime:
    return datetime.now(timezone.utc)


def status_of(contest: Contest, at: datetime | None = None) -> str:
    at = at or now()
    if at < as_utc(contest.start_at):
        return "upcoming"
    if at < as_utc(contest.end_at):
        return "live"
    return "ended"


def get_contest(db: Session, contest_id: int) -> Contest:
    contest = db.query(Contest).filter(Contest.id == contest_id).first()
    if contest is None:
        raise ContestError(404, "No such contest.")
    return contest


def _entry(db: Session, contest_id: int, user_id: int) -> ContestEntry | None:
    return (
        db.query(ContestEntry)
        .filter(ContestEntry.contest_id == contest_id, ContestEntry.user_id == user_id)
        .first()
    )


# --- Student side --------------------------------------------------------------

def list_for_student(db: Session, user: User) -> dict:
    at = now()
    contests = db.query(Contest).order_by(Contest.start_at.desc()).all()
    mine = {
        e.contest_id: ("submitted" if e.submitted_at else "draft")
        for e in db.query(ContestEntry).filter(ContestEntry.user_id == user.id)
    }
    return {
        "server_now": at,
        "contests": [
            {
                "id": c.id,
                "title": c.title,
                "start_at": c.start_at,
                "end_at": c.end_at,
                "status": status_of(c, at),
                "results_published": c.results_published,
                "my_status": mine.get(c.id),
            }
            for c in contests
        ],
    }


def detail_for_student(db: Session, contest_id: int) -> dict:
    contest = get_contest(db, contest_id)
    at = now()
    status = status_of(contest, at)
    sealed = status == "upcoming"
    return {
        "id": contest.id,
        "title": contest.title,
        "start_at": contest.start_at,
        "end_at": contest.end_at,
        "status": status,
        "results_published": contest.results_published,
        "brief": None if sealed else contest.brief,
        "rules": None if sealed else contest.rules,
        "starter_code": None if sealed else contest.starter_code,
        "server_now": at,
    }


def entry_for_student(db: Session, contest_id: int, user: User) -> dict:
    contest = get_contest(db, contest_id)
    at = now()
    if status_of(contest, at) == "upcoming":
        raise ContestError(403, "This contest hasn't started yet.")
    entry = _entry(db, contest_id, user.id)
    reveal = contest.results_published and entry is not None
    return {
        # No entry yet: the editor opens on the contest's starter code.
        "code": entry.code if entry else contest.starter_code,
        "updated_at": entry.updated_at if entry else None,
        "submitted_at": entry.submitted_at if entry else None,
        "score": entry.score if reveal else None,
        "judge_comment": entry.judge_comment if reveal else None,
        "server_now": at,
    }


def _writable_entry(db: Session, contest_id: int, user: User) -> ContestEntry:
    """The student's entry, created on first save, after checking the window."""
    contest = get_contest(db, contest_id)
    at = now()
    if at < as_utc(contest.start_at):
        raise ContestError(403, "This contest hasn't started yet.")
    if at > as_utc(contest.end_at) + SAVE_GRACE:
        raise ContestError(403, "Time's up — this contest has ended.")

    entry = _entry(db, contest_id, user.id)
    if entry is None:
        entry = ContestEntry(contest_id=contest_id, user_id=user.id, code="")
        db.add(entry)
        try:
            db.flush()
        except IntegrityError:
            # Two tabs saving the very first time race on the unique
            # constraint; the loser just picks up the row the winner made.
            db.rollback()
            entry = _entry(db, contest_id, user.id)
    if entry.submitted_at is not None:
        raise ContestError(409, "You've already submitted — your entry is locked.")
    return entry


def save_entry(db: Session, contest_id: int, user: User, code: str) -> dict:
    entry = _writable_entry(db, contest_id, user)
    entry.code = code
    entry.updated_at = now()
    db.commit()
    return entry_for_student(db, contest_id, user)


def submit_entry(db: Session, contest_id: int, user: User, code: str) -> dict:
    """Save the final code and lock it in one step, so what's judged is
    exactly what was on screen when the student pressed Submit."""
    entry = _writable_entry(db, contest_id, user)
    entry.code = code
    entry.updated_at = entry.submitted_at = now()
    db.commit()
    return entry_for_student(db, contest_id, user)


def leaderboard(db: Session, contest_id: int, user: User) -> list[dict]:
    contest = get_contest(db, contest_id)
    if not contest.results_published:
        raise ContestError(403, "Results haven't been published yet.")
    rows = (
        db.query(ContestEntry, User.name)
        .join(User, User.id == ContestEntry.user_id)
        .filter(ContestEntry.contest_id == contest_id, ContestEntry.score.isnot(None))
        .order_by(ContestEntry.score.desc())
        .all()
    )
    # Standard competition ranking: equal scores share a rank (1, 2, 2, 4).
    board, rank, prev = [], 0, None
    for i, (entry, name) in enumerate(rows, start=1):
        if entry.score != prev:
            rank, prev = i, entry.score
        board.append({"rank": rank, "name": name, "score": entry.score, "is_me": entry.user_id == user.id})
    return board


# --- Organizer side ------------------------------------------------------------

def _with_counts(db: Session, contests: list[Contest]) -> list[dict]:
    ids = [c.id for c in contests]
    counts = dict.fromkeys(ids, (0, 0))
    if ids:
        for cid, total, submitted in (
            db.query(
                ContestEntry.contest_id,
                func.count(ContestEntry.id),
                func.count(ContestEntry.submitted_at),
            )
            .filter(ContestEntry.contest_id.in_(ids))
            .group_by(ContestEntry.contest_id)
        ):
            counts[cid] = (total, submitted)
    return [
        {
            **{col: getattr(c, col) for col in (
                "id", "title", "brief", "rules", "starter_code",
                "start_at", "end_at", "results_published", "created_at",
            )},
            "entry_count": counts[c.id][0],
            "submitted_count": counts[c.id][1],
        }
        for c in contests
    ]


def list_for_admin(db: Session) -> list[dict]:
    return _with_counts(db, db.query(Contest).order_by(Contest.start_at.desc()).all())


def create_contest(db: Session, data: ContestWrite) -> dict:
    contest = Contest(**data.model_dump())
    db.add(contest)
    db.commit()
    db.refresh(contest)
    return _with_counts(db, [contest])[0]


def update_contest(db: Session, contest_id: int, data: ContestWrite) -> dict:
    contest = get_contest(db, contest_id)
    for field, value in data.model_dump().items():
        setattr(contest, field, value)
    db.commit()
    db.refresh(contest)
    return _with_counts(db, [contest])[0]


def delete_contest(db: Session, contest_id: int) -> None:
    contest = get_contest(db, contest_id)
    # Entries go explicitly rather than trusting the FK cascade, which SQLite
    # (used in tests) ignores unless foreign keys are switched on.
    db.query(ContestEntry).filter(ContestEntry.contest_id == contest_id).delete()
    db.delete(contest)
    db.commit()


def _entry_row(entry: ContestEntry, user: User, with_code: bool = False) -> dict:
    row = {
        "id": entry.id,
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "updated_at": entry.updated_at,
        "submitted_at": entry.submitted_at,
        "score": entry.score,
        "judge_comment": entry.judge_comment,
        "code_length": len(entry.code or ""),
    }
    if with_code:
        row["code"] = entry.code
    return row


def list_entries(db: Session, contest_id: int) -> list[dict]:
    get_contest(db, contest_id)
    rows = (
        db.query(ContestEntry, User)
        .join(User, User.id == ContestEntry.user_id)
        .filter(ContestEntry.contest_id == contest_id)
        .order_by(User.name)
        .all()
    )
    return [_entry_row(entry, user) for entry, user in rows]


def _entry_by_id(db: Session, contest_id: int, entry_id: int) -> tuple[ContestEntry, User]:
    row = (
        db.query(ContestEntry, User)
        .join(User, User.id == ContestEntry.user_id)
        .filter(ContestEntry.contest_id == contest_id, ContestEntry.id == entry_id)
        .first()
    )
    if row is None:
        raise ContestError(404, "No such entry.")
    return row


def get_entry(db: Session, contest_id: int, entry_id: int) -> dict:
    entry, user = _entry_by_id(db, contest_id, entry_id)
    return _entry_row(entry, user, with_code=True)


def score_entry(db: Session, contest_id: int, entry_id: int, score: int | None, comment: str | None) -> dict:
    entry, user = _entry_by_id(db, contest_id, entry_id)
    entry.score = score
    entry.judge_comment = (comment or "").strip() or None
    db.commit()
    return _entry_row(entry, user, with_code=True)
