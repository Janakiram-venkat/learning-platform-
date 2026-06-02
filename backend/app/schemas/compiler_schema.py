from pydantic import BaseModel

class CodeRequest(BaseModel):
    code: str

class CodeResponse(BaseModel):
    output: str
