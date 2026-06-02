from fastapi import APIRouter
from app.schemas.compiler_schema import CodeRequest, CodeResponse
from app.services import compiler_service

router = APIRouter()

@router.post("/run-python", response_model=CodeResponse)
def run_python(request: CodeRequest):
    output = compiler_service.execute_python_code(request.code)
    return CodeResponse(output=output)
