# Student Coding Platform

An interactive coding and learning platform designed to help students learn Python through structured courses, modules, quizzes, and an integrated in-browser coding environment.

---

## 🚀 Quick Start Commands

### Backend (FastAPI)
Run these commands from the `backend` directory.

#### On Windows (PowerShell/CMD):

```powershell
# create virtual environtemt 
pythom -m venv venv
#for first time install requirements 
pip install -r requirements.txt
# Activate the virtual environment
venv\Scripts\activate
# Start the FastAPI server with reload
uvicorn app.main:app --reload
```

#### On macOS/Linux:
```bash
# Activate the virtual environment
source venv/bin/activate

# Start the FastAPI server with reload
uvicorn app.main:app --reload
```

> [!NOTE]  
> If you encountered a `ModuleNotFoundError: No module named 'services'` previously, it is because Uvicorn was looking for a module named `services`. The correct module path from the `backend` directory is `app.main:app`.

---

### Frontend (React + Vite)
Run these commands from the `frontend` directory.

```bash
# Install dependencies (if not already done)
npm install

# Start the Vite development server
npm run dev
```

---

## 📁 Repository Structure

```
learning-platform/
├── backend/                  # FastAPI backend application
│   ├── app/                  # Main application source code
│   │   ├── api/              # API router files (courses, compiler, quiz, lessons)
│   │   ├── schemas/          # Pydantic schemas/models
│   │   ├── services/         # Business logic & services (compiler_service, course_service)
│   │   └── main.py           # FastAPI entrypoint
│   └── venv/                 # Python virtual environment
│
├── frontend/                 # React frontend application
│   ├── src/                  # React source files
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # View pages (Home, Courses, LessonPage)
│   │   ├── routes/           # Routing configuration
│   │   └── services/         # API integration services (axios)
│   └── package.json          # Node dependencies and scripts
│
└── courses/                  # Course files & lesson definitions
    └── python/               # Python courses
        ├── course.json       # General course syllabus metadata
        └── lessons/          # Specific lessons and modules data
```

---

## 🛠️ Key Technologies

*   **Frontend**: React (v19), Vite, Tailwind CSS, Monaco Editor (for a rich, vscode-like code editing experience).
*   **Backend**: FastAPI, Uvicorn, Python standard libraries.
*   **Execution**: Python subprocess execution (for running student code securely with timeouts).

---

## ⚡ API Endpoints Summary

All backend API endpoints are prefixed with `/api`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/courses` | Retrieve list of all available courses |
| `GET` | `/api/courses/{course_id}` | Retrieve details for a specific course |
| `GET` | `/api/courses/{course_id}/modules/{module_id}` | Retrieve a specific module within a course |
| `POST` | `/api/run-python` | Execute python code and return standard output |
