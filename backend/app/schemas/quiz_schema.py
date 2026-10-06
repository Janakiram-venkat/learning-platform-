from pydantic import BaseModel
from typing import List, Optional


class QuizRequest(BaseModel):
    lessonId: str
    answers: List[int]


class QuizQuestionResult(BaseModel):
    correct: bool
    correctIndex: int
    chosenIndex: int
    explain: Optional[str] = None


class QuizResponse(BaseModel):
    score: int
    total: int
    # Per-question breakdown so the UI can show what was right/wrong and why.
    results: List[QuizQuestionResult] = []
