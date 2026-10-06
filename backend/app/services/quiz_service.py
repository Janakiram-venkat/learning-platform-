from sqlalchemy.orm import Session

from app.models.quiz_attempt import QuizAttempt
from app.services.course_service import get_lesson_by_id


def submit_quiz(
    course_id: str,
    lesson_id: str,
    answers: list[int],
    db: Session | None = None,
    user_id: int | None = None,
):
    """Grade a quiz submission and optionally persist the attempt.

    `db` and `user_id` are optional so the function stays testable without a
    database, and so the quiz router can pass them through when a signed-in
    student submits.
    """
    lesson = get_lesson_by_id(course_id, lesson_id)
    if not lesson or "quiz" not in lesson:
        return {"error": "Quiz not found"}

    quizzes = lesson["quiz"]
    score = 0
    total = len(quizzes)
    results = []

    for i, quiz in enumerate(quizzes):
        correct_index = quiz.get("answer")
        chosen = answers[i] if i < len(answers) else -1
        is_correct = chosen == correct_index
        if is_correct:
            score += 1
        results.append({
            "correct": is_correct,
            "correctIndex": correct_index,
            "chosenIndex": chosen,
            # Explanation is shown to the student after they answer.
            "explain": quiz.get("explain"),
        })

    # Persist the attempt so admins can see quiz history and struggling lessons.
    if db is not None and user_id is not None:
        attempt = QuizAttempt(
            user_id=user_id,
            course_id=course_id,
            lesson_id=lesson_id,
            score=score,
            total=total,
        )
        db.add(attempt)
        db.commit()

    return {"score": score, "total": total, "results": results}
