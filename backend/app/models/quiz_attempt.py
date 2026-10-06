"""SQLAlchemy model for recording every quiz submission a student makes.

Storing attempts server-side lets admins see which lessons students struggle
with and prevents the frontend from being the only source of quiz history.
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.db import Base


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(100), nullable=False)
    lesson_id = Column(String(100), nullable=False)
    score = Column(Integer, nullable=False)
    total = Column(Integer, nullable=False)
    attempted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
