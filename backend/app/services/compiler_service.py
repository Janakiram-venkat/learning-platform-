import subprocess
import os
import sys


def execute_python_code(code: str, stdin: str = "") -> dict:
    """Execute python code and return a structured result.

    `stdin` is fed to the program so that input() prompts work (each answer
    should be separated by a newline).

    Returns a dict with:
      - output:      the program's stdout (plus a formatted error block for a
                     genuine crash, kept for backward compatibility).
      - needs_input: True when the program stopped because it tried to read
                     input() but stdin was exhausted (i.e. it is "waiting" for
                     the learner to type something). The interactive terminal
                     uses this to prompt for the next line and re-run.

    NOTE: This runs Python via subprocess directly. NOT safe for production —
    needs a Docker/gVisor sandbox before untrusted use.
    """
    try:
        result = subprocess.run(
            [sys.executable, "-c", code],
            input=stdin,
            capture_output=True,
            text=True,
            timeout=5,
        )
        stdout = result.stdout or ""

        if result.returncode == 0:
            return {"output": stdout, "needs_input": False}

        stderr = result.stderr or ""
        # An EOFError raised while reading input() means the program is waiting
        # for the next line of input rather than genuinely crashing. Surface the
        # partial stdout (which includes any prompt the program printed) so the
        # terminal can ask the learner for input and continue.
        if "EOFError" in stderr:
            return {"output": stdout, "needs_input": True}

        # A real error: keep the legacy "Error:\n<traceback>" shape so existing
        # output/checks keep working.
        prefix = stdout + ("\n" if stdout else "")
        return {"output": f"{prefix}Error:\n{stderr}", "needs_input": False}

    except subprocess.TimeoutExpired:
        return {"output": "Error: Execution timed out.", "needs_input": False}
    except Exception as e:
        return {"output": f"Error: {str(e)}", "needs_input": False}
