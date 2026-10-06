from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.db import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    # Optional — anonymous feedback is allowed when no one is signed in.
    user_email = Column(String(255), nullable=True, index=True)
    course_id = Column(String(100), nullable=True)
    # How many modules the student had completed when prompted.
    modules_completed = Column(Integer, nullable=True)
    # 1-5 star rating for content + animations.
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
