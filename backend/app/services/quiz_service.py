from app.services.course_service import get_lesson_by_id

def submit_quiz(course_id: str, lesson_id: str, answers: list[int]):
    lesson = get_lesson_by_id(course_id, lesson_id)
    if not lesson or "quiz" not in lesson:
        return {"error": "Quiz not found"}
    
    quizzes = lesson["quiz"]
    score = 0
    total = len(quizzes)
    
    for i, quiz in enumerate(quizzes):
        if i < len(answers):
            if answers[i] == quiz.get("answer"):
                score += 1
                
    return {"score": score, "total": total}
