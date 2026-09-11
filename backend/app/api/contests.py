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
    ContestAdmin,
    ContestDetail,
    ContestList,
    ContestWrite,
    EntryDetail,
    EntryRow,
    EntrySave,
    EntryScore,
    EntryView,
    LeaderboardRow,
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
def get_contest(contest_id: int, db: Session = Depends(get_db)):
    """The brief, rules and starter code are null until the contest starts."""
    return svc.detail_for_student(db, contest_id)


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
