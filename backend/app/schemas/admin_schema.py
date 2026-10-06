from datetime import datetime
from pydantic import BaseModel, EmailStr


class AdminStats(BaseModel):
    """Headline numbers for the admin dashboard."""
    total_users: int
    admin_users: int
    google_users: int
    new_users_7d: int
    active_users_7d: int
    total_xp: int
    lessons_completed: int
    assignments_completed: int
    projects_completed: int
    labs_completed: int
    feedback_count: int
    average_rating: float | None


class AdminUserRow(BaseModel):
    """One row of the admin user table: profile + a progress summary."""
    id: int
    email: EmailStr
    name: str
    interests: list[str] = []
    is_admin: bool
    has_password: bool
    created_at: datetime
    total_xp: int
    lessons_completed: int
    assignments_completed: int
    projects_completed: int
    labs_completed: int
    badges: int


class AdminFeedbackRow(BaseModel):
    id: int
    user_email: str | None = None
    course_id: str | None = None
    modules_completed: int | None = None
    rating: int
    comment: str | None = None
    created_at: datetime


class CourseUsageRow(BaseModel):
    """How many students have touched each course, for the usage bars."""
    course_id: str
    title: str
    learners: int
    items_completed: int
