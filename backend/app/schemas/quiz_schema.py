from pydantic import BaseModel
from typing import List

class QuizRequest(BaseModel):
    lessonId: str
    answers: List[int]

class QuizResponse(BaseModel):
    score: int
    total: int
