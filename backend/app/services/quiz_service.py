from app.services.course_service import get_lesson_by_id


def submit_quiz(course_id: str, lesson_id: str, answers: list[int]):
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

    return {"score": score, "total": total, "results": results}
