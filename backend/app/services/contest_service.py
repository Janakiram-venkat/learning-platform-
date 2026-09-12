"""Contest rules: the time window, one entry per student, judging, leaderboard.

Every time check happens here against the server clock. The browser's
countdown is a convenience; a student whose laptop clock is wrong (or who
changes it) still can't save before the start or after the end.
"""
import re
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.contest import Contest, ContestEntry, ContestInvite
from app.models.user import User
from app.schemas.contest_schema import ContestWrite, as_utc

# An autosave fired a moment before the deadline can land a moment after it.
# Accept those rather than lose the student's last edits.
SAVE_GRACE = timedelta(seconds=30)


# A double-quoted run is always a display name, and it may hold a comma
# ("Bob, Jr." <bob@example.com>) that would otherwise split the record in
# two. Drop those runs before splitting anything.
_QUOTED = re.compile(r'"[^"]*"')
# One pasted record per line, or per comma / semicolon within a line.
_RECORDS = re.compile(r"[,;\n\r]+")
# "Ada Lovelace <ada@example.com>" is what a copied mail-client row looks
# like: when a record brackets an address, that address is the whole record
# and the display name around it is noise, not a typo to report back.
_ANGLED = re.compile(r"<([^<>]*)>")
# Deliberately loose. The point is to catch a typo'd paste, not to police
# which addresses exist — only an address that matches a real account ever
# unlocks anything.
_EMAIL = re.compile(r"^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$")


def parse_emails(blob: str) -> tuple[list[str], list[str]]:
    """Split a pasted class list into (valid lowercased emails, rejects).

    Order is preserved and repeats within the same paste collapse, so the
    organizer sees the list back in the order they typed it.
    """
    valid: list[str] = []
    invalid: list[str] = []
    seen: set[str] = set()

    def take(token: str) -> None:
        token = token.strip().strip("<>,;\"'").lower()
        if not token or token in seen:
            return
        seen.add(token)
        (valid if _EMAIL.match(token) else invalid).append(token)

    for record in _RECORDS.split(_QUOTED.sub(" ", blob or "")):
        angled = _ANGLED.search(record)
        if angled:
            take(angled.group(1))
            continue
        # No brackets, so whitespace is just another separator: a line of
        # space-separated addresses is as valid as one per line.
        for token in record.split():
            take(token)
    return valid, invalid


class ContestError(Exception):
    """A rule was broken. `status` is the HTTP code the API should answer with."""

    def __init__(self, status: int, detail: str):
        super().__init__(detail)
        self.status = status
        self.detail = detail


def now() -> datetime:
    return datetime.now(timezone.utc)


def _next_hour(at: datetime) -> datetime:
    """The top of the next hour — a tidier default than "now plus a bit"."""
    return at.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)


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


def _invite_emails(db: Session, contest_id: int) -> set[str]:
    return {
        e for (e,) in db.query(ContestInvite.email).filter(ContestInvite.contest_id == contest_id)
    }


def is_invited(db: Session, contest: Contest, user: User) -> bool:
    """Can this student see and enter this contest?

    An open contest is open to everyone signed in. An invite-only one matches
    on email, so an invite written before the student signed up starts
    working the moment they do. Admins always get in, so an organizer can
    open a contest to check it without inviting themselves.
    """
    if not contest.invite_only or user.is_admin:
        return True
    return (user.email or "").lower() in _invite_emails(db, contest.id)


def _visible_contest(db: Session, contest_id: int, user: User) -> Contest:
    """get_contest, but an uninvited student gets the 404 as well.

    Same answer for "no such contest" and "not invited" on purpose: the list
    of who is running a private contest is not something to leak by probing
    ids.
    """
    contest = get_contest(db, contest_id)
    if not is_invited(db, contest, user):
        raise ContestError(404, "No such contest.")
    return contest


# --- Student side --------------------------------------------------------------

def list_for_student(db: Session, user: User) -> dict:
    at = now()
    contests = db.query(Contest).order_by(Contest.start_at.desc()).all()
    if not user.is_admin and any(c.invite_only for c in contests):
        # One query for every invite naming this student, rather than one per
        # invite-only contest on the page.
        invited_to = {
            cid for (cid,) in db.query(ContestInvite.contest_id)
            .filter(ContestInvite.email == (user.email or "").lower())
        }
        contests = [c for c in contests if not c.invite_only or c.id in invited_to]
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
                "invite_only": c.invite_only,
                "my_status": mine.get(c.id),
            }
            for c in contests
        ],
    }


def detail_for_student(db: Session, contest_id: int, user: User) -> dict:
    contest = _visible_contest(db, contest_id, user)
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
        "invite_only": contest.invite_only,
        "brief": None if sealed else contest.brief,
        "rules": None if sealed else contest.rules,
        "starter_code": None if sealed else contest.starter_code,
        "server_now": at,
    }


def entry_for_student(db: Session, contest_id: int, user: User) -> dict:
    contest = _visible_contest(db, contest_id, user)
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
    contest = _visible_contest(db, contest_id, user)
    at = now()
    if at < as_utc(contest.start_at):
        raise ContestError(403, "This contest hasn't started yet.")
    if at > as_utc(contest.end_at) + SAVE_GRACE:
        raise ContestError(403, "Time's up! This contest has ended.")

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
        raise ContestError(409, "You've already submitted, so your entry is locked.")
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
    contest = _visible_contest(db, contest_id, user)
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
    invites = dict.fromkeys(ids, 0)
    if ids:
        for cid, total in (
            db.query(ContestInvite.contest_id, func.count(ContestInvite.id))
            .filter(ContestInvite.contest_id.in_(ids))
            .group_by(ContestInvite.contest_id)
        ):
            invites[cid] = total
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
                "start_at", "end_at", "results_published", "invite_only", "created_at",
            )},
            "entry_count": counts[c.id][0],
            "submitted_count": counts[c.id][1],
            "invite_count": invites[c.id],
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


def duplicate_contest(db: Session, contest_id: int) -> dict:
    """Clone a contest as a fresh upcoming one, entries left behind.

    Running the same brief with next week's class is the common case, so the
    invite list comes along; the entries and the published-results flag do
    not, since the copy has not been run yet.
    """
    src = get_contest(db, contest_id)
    length = as_utc(src.end_at) - as_utc(src.start_at)
    start = _next_hour(now())
    copy = Contest(
        title=f"{src.title} (copy)",
        brief=src.brief,
        rules=src.rules,
        starter_code=src.starter_code,
        start_at=start,
        end_at=start + length,
        results_published=False,
        invite_only=src.invite_only,
    )
    db.add(copy)
    db.flush()
    for email in _invite_emails(db, contest_id):
        db.add(ContestInvite(contest_id=copy.id, email=email))
    db.commit()
    db.refresh(copy)
    return _with_counts(db, [copy])[0]


# --- Organizer side: running the contest ----------------------------------------
#
# Edit-the-window is fine when nothing is happening yet, but an organizer
# standing in front of a room needs one-press controls: open the doors now,
# call time, give everyone five more minutes. Each of these moves exactly one
# edge of the window and leaves every other field alone.

def start_now(db: Session, contest_id: int, minutes: int | None = None) -> dict:
    """Open the contest immediately.

    Length is `minutes` when given, otherwise however long the contest was
    already scheduled to run, so "start now" on a planned 90-minute contest
    still runs 90 minutes.
    """
    contest = get_contest(db, contest_id)
    at = now()
    planned = as_utc(contest.end_at) - as_utc(contest.start_at)
    length = timedelta(minutes=minutes) if minutes else planned
    if length <= timedelta(0):
        raise ContestError(400, "A contest needs a length greater than zero.")
    contest.start_at = at
    contest.end_at = at + length
    db.commit()
    db.refresh(contest)
    return _with_counts(db, [contest])[0]


def end_now(db: Session, contest_id: int) -> dict:
    """Call time. Entries stop being writable the moment this lands."""
    contest = get_contest(db, contest_id)
    at = now()
    # A contest stopped before it opened would leave start after end; pull the
    # start back so the row reads "ended" rather than going inconsistent.
    contest.start_at = min(as_utc(contest.start_at), at)
    contest.end_at = at
    db.commit()
    db.refresh(contest)
    return _with_counts(db, [contest])[0]


def add_time(db: Session, contest_id: int, minutes: int) -> dict:
    """Move the deadline by `minutes`, positive or negative.

    Extending an already-ended contest reopens it, counting from now rather
    than from the deadline that has passed — otherwise "+10 minutes" on a
    contest that ended an hour ago would change nothing visible.
    """
    if minutes == 0:
        raise ContestError(400, "Pick how many minutes to add.")
    contest = get_contest(db, contest_id)
    at = now()
    base = max(as_utc(contest.end_at), at) if minutes > 0 else as_utc(contest.end_at)
    end = base + timedelta(minutes=minutes)
    if end <= as_utc(contest.start_at):
        raise ContestError(400, "That would end the contest before it starts.")
    contest.end_at = end
    db.commit()
    db.refresh(contest)
    return _with_counts(db, [contest])[0]


def set_results(db: Session, contest_id: int, published: bool) -> dict:
    """Show or hide the leaderboard without touching anything else."""
    contest = get_contest(db, contest_id)
    contest.results_published = published
    db.commit()
    db.refresh(contest)
    return _with_counts(db, [contest])[0]


def delete_contest(db: Session, contest_id: int) -> None:
    contest = get_contest(db, contest_id)
    # Entries go explicitly rather than trusting the FK cascade, which SQLite
    # (used in tests) ignores unless foreign keys are switched on.
    db.query(ContestEntry).filter(ContestEntry.contest_id == contest_id).delete()
    db.query(ContestInvite).filter(ContestInvite.contest_id == contest_id).delete()
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


# --- Organizer side: the invite list --------------------------------------------

def _invite_rows(db: Session, contest_id: int) -> list[dict]:
    """Every invite for a contest, told apart by how far it has got:
    invited, signed up, or actually working on an entry."""
    invites = (
        db.query(ContestInvite)
        .filter(ContestInvite.contest_id == contest_id)
        .order_by(ContestInvite.email)
        .all()
    )
    if not invites:
        return []

    emails = [i.email for i in invites]
    # func.lower on the stored address: existing accounts predate the invite
    # list, so their emails were never normalised on the way in.
    accounts = {
        email.lower(): (uid, name)
        for uid, name, email in db.query(User.id, User.name, User.email)
        .filter(func.lower(User.email).in_(emails))
    }
    entrants = {
        uid for (uid,) in db.query(ContestEntry.user_id)
        .filter(ContestEntry.contest_id == contest_id)
    }
    rows = []
    for invite in invites:
        uid, name = accounts.get(invite.email, (None, None))
        rows.append({
            "id": invite.id,
            "email": invite.email,
            "created_at": invite.created_at,
            "has_account": uid is not None,
            "name": name,
            "has_entry": uid in entrants,
        })
    return rows


def list_invites(db: Session, contest_id: int) -> list[dict]:
    get_contest(db, contest_id)
    return _invite_rows(db, contest_id)


def add_invites(db: Session, contest_id: int, blob: str) -> dict:
    """Add a pasted batch of emails to the contest's invite list."""
    get_contest(db, contest_id)
    emails, invalid = parse_emails(blob)
    existing = _invite_emails(db, contest_id)

    added, duplicates = [], []
    for email in emails:
        if email in existing:
            duplicates.append(email)
            continue
        db.add(ContestInvite(contest_id=contest_id, email=email))
        existing.add(email)
        added.append(email)
    db.commit()
    return {
        "added": added,
        "duplicates": duplicates,
        "invalid": invalid,
        "invites": _invite_rows(db, contest_id),
    }


def remove_invite(db: Session, contest_id: int, invite_id: int) -> None:
    """Take someone off the list.

    Any entry they already started is left alone: a withdrawn invite closes
    the door, it does not destroy work the organizer may still want to judge.
    """
    invite = (
        db.query(ContestInvite)
        .filter(ContestInvite.contest_id == contest_id, ContestInvite.id == invite_id)
        .first()
    )
    if invite is None:
        raise ContestError(404, "No such invite.")
    db.delete(invite)
    db.commit()
