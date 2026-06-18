from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    user_email: Optional[str] = None
    course_id: Optional[str] = None
    modules_completed: Optional[int] = None


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_email: Optional[str] = None
    course_id: Optional[str] = None
    modules_completed: Optional[int] = None
    rating: int
    comment: Optional[str] = None
    created_at: datetime
