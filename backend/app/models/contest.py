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
