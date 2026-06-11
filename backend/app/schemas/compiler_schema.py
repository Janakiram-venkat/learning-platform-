from pydantic import BaseModel

class CodeRequest(BaseModel):
    code: str
    stdin: str = ""

class CodeResponse(BaseModel):
    output: str
