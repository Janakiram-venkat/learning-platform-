"""Game-dev contests: a timed brief that students answer with a Python game.

Times are timezone-aware (timestamptz), unlike the rest of the schema's naive
utcnow columns — a contest window that silently shifts by the server's offset
would open or close at the wrong moment for a whole room of students.
"""
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint,
)

from app.db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Contest(Base):
    __tablename__ = "contests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    # The theme / problem statement. Hidden from students until start_at so
    # nobody gets a head start.
    brief = Column(Text, nullable=False, default="")
    rules = Column(Text, nullable=False, default="")
    # What every student's editor opens with. Empty means a blank editor.
    starter_code = Column(Text, nullable=False, default="")
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)
    # Once true, students can see the scored leaderboard.
    results_published = Column(Boolean, nullable=False, default=False, server_default="false")
    # False (the default) means every signed-in student can enter. True means
    # only the emails on the contest's invite list can see or enter it.
    invite_only = Column(Boolean, nullable=False, default=False, server_default="false")
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)


class ContestEntry(Base):
    """One student's game for one contest.

    Autosave keeps overwriting `code`; Submit stamps `submitted_at` and locks
    it. An entry that was never submitted still counts at the deadline — its
    last autosave is what gets judged.
    """
    __tablename__ = "contest_entries"
    __table_args__ = (UniqueConstraint("contest_id", "user_id", name="uq_contest_entry_user"),)

    id = Column(Integer, primary_key=True, index=True)
    contest_id = Column(Integer, ForeignKey("contests.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(Text, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    # Filled in by an organizer while judging.
    score = Column(Integer, nullable=True)
    judge_comment = Column(Text, nullable=True)


class ContestInvite(Base):
    """One invited email for one invite-only contest.

    Keyed by email rather than user_id on purpose: an organizer usually has a
    class list before those students have signed up. The invite matches
    whoever holds that address whenever they do, and stays valid if they
    later change their name. Emails are stored lowercased so the lookup is a
    plain equality check on every database.
    """
    __tablename__ = "contest_invites"
    __table_args__ = (UniqueConstraint("contest_id", "email", name="uq_contest_invite_email"),)

    id = Column(Integer, primary_key=True, index=True)
    contest_id = Column(Integer, ForeignKey("contests.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)
