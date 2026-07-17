from fastapi import APIRouter
from app.schemas.compiler_schema import CodeRequest, CodeResponse
from app.services import compiler_service

router = APIRouter()

@router.post("/run-python", response_model=CodeResponse)
def run_python(request: CodeRequest):
    result = compiler_service.execute_python_code(request.code, request.stdin)
    return CodeResponse(output=result["output"], needs_input=result["needs_input"])
