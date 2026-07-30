"""Admin-only dashboard endpoints.

Every route here depends on `get_current_admin`, so a normal student's token
gets a 403 no matter what the frontend does.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.db import get_db
from app.models.user import User
from app.schemas.admin_schema import (
    AdminFeedbackRow,
    AdminStats,
    AdminUserRow,
    CourseUsageRow,
)
from app.services import admin_service

router = APIRouter(prefix="/admin", dependencies=[Depends(get_current_admin)])


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db)):
    """Headline numbers across all accounts."""
    return admin_service.get_stats(db)


@router.get("/users", response_model=list[AdminUserRow])
def users(search: str | None = None, limit: int = 200, db: Session = Depends(get_db)):
    """All accounts (newest first) with a per-student progress summary."""
    return admin_service.list_users(db, search, limit)


@router.get("/courses", response_model=list[CourseUsageRow])
def courses(db: Session = Depends(get_db)):
    """Per-course learner counts, busiest course first."""
    return admin_service.course_usage(db)


@router.get("/feedback", response_model=list[AdminFeedbackRow])
def feedback(limit: int = 100, db: Session = Depends(get_db)):
    """Recent student feedback, most recent first."""
    return admin_service.list_feedback(db, limit)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Remove a student account and its progress.

    Admin accounts are protected: demote one from the database first if it
    really needs to go. This also covers the self-delete case.
    """
    target = db.query(User).filter(User.id == user_id).first()
    if target is None:
        raise HTTPException(status_code=404, detail="No such user.")
    if target.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts can't be deleted from the dashboard.",
        )
    admin_service.delete_user(db, user_id)
    return None
