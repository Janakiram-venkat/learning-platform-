"""Code execution endpoints.

Only Java and C++ need the server: Python runs in the browser under Pyodide,
and HTML/CSS/JS renders in a sandboxed iframe. See `services/java_runner` for
why compiled languages are the exception and how the response shape is shared
with the Python path, and `services/cpp_runner` for the C++ specifics.
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.limiter import limiter
from app.services.cpp_runner import CppRunnerError, run_cpp
from app.services.java_runner import JavaRunnerError, run_java

router = APIRouter()

# Generous enough for a module-10 project, small enough that nobody is posting a
# library through this endpoint.
MAX_CODE_CHARS = 40_000
MAX_STDIN_CHARS = 4_000


class RunCodeRequest(BaseModel):
    code: str = Field(max_length=MAX_CODE_CHARS)
    stdin: str = Field(default="", max_length=MAX_STDIN_CHARS)


@router.post("/run-java")
# Tighter than the default per-route limit: every run costs a container on the
# execution service, and grading a project fires one request per test case. The
# cap is per user (see core.limiter), so it is a busy learner's ceiling, not a
# classroom's.
@limiter.limit("40/minute")
def run_java_endpoint(request: Request, payload: RunCodeRequest):
    """Compile and run one Java program, returning `{output, needs_input}`."""
    try:
        result = run_java(payload.code, payload.stdin)
    except JavaRunnerError as e:
        # 502: our own service is fine, the thing behind it isn't.
        raise HTTPException(status_code=502, detail=str(e)) from e
    return {"success": True, "data": result}


@router.post("/run-cpp")
# Same budget as Java: one compile per new program (re-runs for more input hit
# the binary cache) and one run per project test case.
@limiter.limit("40/minute")
def run_cpp_endpoint(request: Request, payload: RunCodeRequest):
    """Compile and run one C++ program, returning `{output, needs_input}`."""
    try:
        result = run_cpp(payload.code, payload.stdin)
    except CppRunnerError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    return {"success": True, "data": result}
