"""Game-dev contests.

Two routers, one feature:
  * `router`        — students (mounted behind sign-in in main.py)
  * `admin_router`  — organizers, /admin/contests/*, staff only

Rules (window, locking, what's hidden when) live in contest_service; these
handlers only translate ContestError into HTTP.
"""
from functools import wraps

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin, get_current_user
from app.db import get_db
from app.models.user import User
from app.schemas.contest_schema import (
    AddTime,
    ContestAdmin,
    ContestDetail,
    ContestList,
    ContestWrite,
    EntryDetail,
    EntryRow,
    EntrySave,
    EntryScore,
    EntryView,
    InviteAdd,
    InviteAddResult,
    InviteRow,
    LeaderboardRow,
    ResultsToggle,
    StartNow,
)
from app.services import contest_service as svc
from app.services.contest_service import ContestError

router = APIRouter(prefix="/contests")
admin_router = APIRouter(prefix="/admin/contests", dependencies=[Depends(get_current_admin)])


def _http(fn):
    """Turn a service-level ContestError into the matching HTTPException."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except ContestError as exc:
            raise HTTPException(status_code=exc.status, detail=exc.detail)
    return wrapper


# --- Students -------------------------------------------------------------------

@router.get("", response_model=ContestList)
@_http
def list_contests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.list_for_student(db, user)


@router.get("/{contest_id}", response_model=ContestDetail)
@_http
def get_contest(contest_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """The brief, rules and starter code are null until the contest starts.

    An invite-only contest answers 404 to anyone not on its list.
    """
    return svc.detail_for_student(db, contest_id, user)


@router.get("/{contest_id}/entry", response_model=EntryView)
@_http
def get_my_entry(contest_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.entry_for_student(db, contest_id, user)


@router.put("/{contest_id}/entry", response_model=EntryView)
@_http
def autosave(contest_id: int, body: EntrySave, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.save_entry(db, contest_id, user, body.code)


@router.post("/{contest_id}/submit", response_model=EntryView)
@_http
def submit(contest_id: int, body: EntrySave, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Final save + lock. After this the entry can't be edited."""
    return svc.submit_entry(db, contest_id, user, body.code)


@router.get("/{contest_id}/leaderboard", response_model=list[LeaderboardRow])
@_http
def leaderboard(contest_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.leaderboard(db, contest_id, user)


# --- Organizers -----------------------------------------------------------------

@admin_router.get("", response_model=list[ContestAdmin])
def admin_list(db: Session = Depends(get_db)):
    return svc.list_for_admin(db)


@admin_router.post("", response_model=ContestAdmin, status_code=status.HTTP_201_CREATED)
def admin_create(body: ContestWrite, db: Session = Depends(get_db)):
    return svc.create_contest(db, body)


@admin_router.put("/{contest_id}", response_model=ContestAdmin)
@_http
def admin_update(contest_id: int, body: ContestWrite, db: Session = Depends(get_db)):
    return svc.update_contest(db, contest_id, body)


@admin_router.delete("/{contest_id}", status_code=status.HTTP_204_NO_CONTENT)
@_http
def admin_delete(contest_id: int, db: Session = Depends(get_db)):
    svc.delete_contest(db, contest_id)
    return None


@admin_router.post("/{contest_id}/duplicate", response_model=ContestAdmin, status_code=status.HTTP_201_CREATED)
@_http
def admin_duplicate(contest_id: int, db: Session = Depends(get_db)):
    """Copy the brief, rules, starter code and invite list into a new contest."""
    return svc.duplicate_contest(db, contest_id)


# Live controls. Editing the window by hand still works; these exist so that
# running a contest in front of a class is one press, not a date picker.

@admin_router.post("/{contest_id}/start", response_model=ContestAdmin)
@_http
def admin_start_now(contest_id: int, body: StartNow, db: Session = Depends(get_db)):
    """Open it right now, for `minutes` or for its scheduled length."""
    return svc.start_now(db, contest_id, body.minutes)


@admin_router.post("/{contest_id}/end", response_model=ContestAdmin)
@_http
def admin_end_now(contest_id: int, db: Session = Depends(get_db)):
    return svc.end_now(db, contest_id)


@admin_router.post("/{contest_id}/time", response_model=ContestAdmin)
@_http
def admin_add_time(contest_id: int, body: AddTime, db: Session = Depends(get_db)):
    return svc.add_time(db, contest_id, body.minutes)


@admin_router.put("/{contest_id}/results", response_model=ContestAdmin)
@_http
def admin_set_results(contest_id: int, body: ResultsToggle, db: Session = Depends(get_db)):
    return svc.set_results(db, contest_id, body.published)


@admin_router.get("/{contest_id}/entries", response_model=list[EntryRow])
@_http
def admin_entries(contest_id: int, db: Session = Depends(get_db)):
    return svc.list_entries(db, contest_id)


@admin_router.get("/{contest_id}/entries/{entry_id}", response_model=EntryDetail)
@_http
def admin_entry(contest_id: int, entry_id: int, db: Session = Depends(get_db)):
    return svc.get_entry(db, contest_id, entry_id)


@admin_router.put("/{contest_id}/entries/{entry_id}/score", response_model=EntryDetail)
@_http
def admin_score(contest_id: int, entry_id: int, body: EntryScore, db: Session = Depends(get_db)):
    return svc.score_entry(db, contest_id, entry_id, body.score, body.judge_comment)


@admin_router.get("/{contest_id}/invites", response_model=list[InviteRow])
@_http
def admin_invites(contest_id: int, db: Session = Depends(get_db)):
    return svc.list_invites(db, contest_id)


@admin_router.post("/{contest_id}/invites", response_model=InviteAddResult)
@_http
def admin_add_invites(contest_id: int, body: InviteAdd, db: Session = Depends(get_db)):
    """Accepts a pasted class list; reports back what was added, what was
    already there, and what did not look like an email."""
    return svc.add_invites(db, contest_id, body.emails)


@admin_router.delete("/{contest_id}/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
@_http
def admin_remove_invite(contest_id: int, invite_id: int, db: Session = Depends(get_db)):
    svc.remove_invite(db, contest_id, invite_id)
    return None
