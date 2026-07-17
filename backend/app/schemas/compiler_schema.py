from pydantic import BaseModel

class CodeRequest(BaseModel):
    code: str
    stdin: str = ""

class CodeResponse(BaseModel):
    output: str
    # True when the program stopped waiting for input() and the terminal should
    # prompt the learner for the next line, then re-run with it appended.
    needs_input: bool = False
