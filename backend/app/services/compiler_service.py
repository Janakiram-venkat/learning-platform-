import subprocess
import os
import sys

def execute_python_code(code: str, stdin: str = "") -> str:
    """Executes python code using subprocess and returns standard output.

    `stdin` is fed to the program so that input() prompts work (each answer
    should be separated by a newline)."""
    try:
        # For an MVP, we are directly running Python via subprocess
        # NOTE: This is NOT safe for production, needs Docker sandbox later
        result = subprocess.run(
            [sys.executable, "-c", code],
            input=stdin,
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            return result.stdout
        else:
            return f"Error:\\n{result.stderr}"
    except subprocess.TimeoutExpired:
        return "Error: Execution timed out."
    except Exception as e:
        return f"Error: {str(e)}"
