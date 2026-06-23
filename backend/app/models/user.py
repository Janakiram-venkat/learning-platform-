from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON
from app.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    # Null for accounts created via Google (they authenticate through Google,
    # not a local password). Set for email + password accounts.
    password_hash = Column(String(255), nullable=True)
    # What the student picked during sign-up, e.g. ["game-dev", "ai", "math"].
    # Used to personalise their learning path. Stored as a JSON array.
    interests = Column(JSON, nullable=False, default=list)
    # The student's learning progress (XP, badges, completed lessons, etc.)
    # stored as a single JSON document. The frontend owns the shape; the
    # backend just persists it per-user so progress follows them across devices.
    progress = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    @property
    def has_password(self) -> bool:
        """True for email + password accounts; False for Google-only ones."""
        return self.password_hash is not None
