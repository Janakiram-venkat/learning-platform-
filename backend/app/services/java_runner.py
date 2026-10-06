"""Compiles and runs a student's Java program.

Java can't run in the browser the way Python does (`services/pyodide.js` ships a
whole CPython to the client), so it is the one language on this platform that
needs the server. Two providers are supported behind one function:

  * `local`  - `javac` + `java` in a temp directory on this host. Needs a JDK
               installed, needs no accounts, and is what runs in development.
  * `piston` - a Piston execution service, which runs each program in a throwaway
               container. The *public* instance at emkc.org became whitelist-only
               in February 2026 and answers 401, so this means a self-hosted one
               (`docker run --privileged ghcr.io/engineer-man/piston/api`).

`local` executes untrusted code directly on the host: a run is capped on wall
clock, heap and output size, but it is not a sandbox - student code can read the
filesystem and open sockets as the API process. That is fine for a laptop and for
a trusted classroom; for a public deployment set PISTON_URL and let the container
be the boundary.

Either way the result shape matches the Python runner's,
`{"output": str, "needs_input": bool}`, because the frontend's `useCodeRunner`
fakes an interactive terminal on top of a batch runner: it re-runs the whole
program with one more line of stdin each time the program asks for input, and
renders only the newly-produced output. For that to work we must report "this
program stopped because it wanted another line of input" rather than surfacing
the exception Java actually throws - see `_EOF_MARKERS`.

Environment:
  JAVA_RUNNER     `local`, `piston`, or `auto` (the default): use Piston when
                  PISTON_URL is set, otherwise the local JDK.
  PISTON_URL      base URL of a Piston instance, e.g. http://piston:2000/api/v2
  PISTON_TOKEN    optional bearer token for a Piston instance behind auth.
  JAVA_VERSION    pin the Piston runtime version instead of discovering it.
  JAVA_HOME       where to find javac/java, if they aren't on PATH.
"""

import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import requests

PISTON_URL = os.getenv("PISTON_URL", "").strip().rstrip("/")
PISTON_TOKEN = os.getenv("PISTON_TOKEN", "").strip()
_PINNED_VERSION = os.getenv("JAVA_VERSION", "").strip()
_PROVIDER = os.getenv("JAVA_RUNNER", "auto").strip().lower()

COMPILE_TIMEOUT_S = 15
RUN_TIMEOUT_S = 8
MAX_HEAP = "128m"
# A runaway `for(;;) System.out.println()` would otherwise stream megabytes at us
# before the timeout fires. Truncate well below anything a lesson prints.
MAX_OUTPUT_CHARS = 100_000
# Piston's HTTP call needs longer than the run itself: queueing, container start,
# compile and run all happen inside that one request.
HTTP_TIMEOUT_S = 45

# A program that reads past the end of stdin is *waiting for input*, not broken.
# Scanner raises NoSuchElementException, and readers over System.in raise
# EOFException. Either one on an otherwise-fine run means "ask the learner for
# another line and run me again".
_EOF_MARKERS = (
    "java.util.NoSuchElementException",
    "java.io.EOFException",
)

# Student code must be compiled under a filename matching its public class, or
# javac refuses. Course content always uses `Main`, but a learner renaming the
# class shouldn't produce a baffling error, so we read the name back out.
_PUBLIC_CLASS = re.compile(
    r"\bpublic\s+(?:final\s+|abstract\s+)?(?:class|interface|enum|record)\s+(\w+)"
)
_ANY_CLASS = re.compile(r"\b(?:class|interface|enum|record)\s+(\w+)")

_version_cache: str | None = None


class JavaRunnerError(RuntimeError):
    """No runner is available, or the one configured could not be reached."""


# --- shared helpers ---------------------------------------------------------

def main_class_name(code: str) -> str:
    """The class javac will expect this file to be named after.

    Prefers the `public` one (that's the rule javac enforces); falls back to the
    first class of any kind, then to `Main` for code that has none yet.
    """
    match = _PUBLIC_CLASS.search(code) or _ANY_CLASS.search(code)
    return match.group(1) if match else "Main"


def _clean_stderr(text: str, class_name: str) -> str:
    """Trim a Java stack trace down to what a beginner can act on.

    Everything below the learner's own frames is JVM plumbing, so we cut the
    trace at the last frame mentioning their class, and drop the temp directory
    from paths so errors read as `Main.java:7`, not `/tmp/xyz/Main.java:7`.
    """
    cleaned = re.sub(r"(?:[A-Za-z]:)?(?:[\\/][^\s:*?\"<>|]*)+[\\/](?=\w+\.java)", "", text).strip()
    lines = cleaned.split("\n")

    last_user_frame = -1
    for i, line in enumerate(lines):
        if line.lstrip().startswith("at ") and class_name in line:
            last_user_frame = i
    if last_user_frame != -1:
        lines = lines[: last_user_frame + 1]

    return "\n".join(lines).strip()


def _truncate(text: str) -> str:
    if len(text) <= MAX_OUTPUT_CHARS:
        return text
    return text[:MAX_OUTPUT_CHARS] + "\n… output truncated (too much printing).\n"


def _with_prefix(stdout: str, message: str) -> str:
    """`message` appended after whatever the program managed to print."""
    if not stdout:
        return message
    separator = "" if stdout.endswith("\n") else "\n"
    return f"{stdout}{separator}{message}"


def _classify(stdout: str, stderr: str, class_name: str) -> dict:
    """Turn a finished run's streams into the `{output, needs_input}` result."""
    stderr = stderr.strip()
    if stderr and any(marker in stderr for marker in _EOF_MARKERS):
        # The program asked for input we don't have yet. Show what it printed
        # (the prompt it wrote before blocking) and let the caller collect a line.
        return {"output": _truncate(stdout), "needs_input": True}
    if stderr:
        return {
            "output": _truncate(_with_prefix(stdout, f"Error:\n{_clean_stderr(stderr, class_name)}")),
            "needs_input": False,
        }
    return {"output": _truncate(stdout), "needs_input": False}


def _timeout_result(stdout: str) -> dict:
    return {
        "output": _truncate(_with_prefix(
            stdout,
            f"Error:\nExecution timed out (over {RUN_TIMEOUT_S}s). "
            "Check for a loop that never ends.",
        )),
        "needs_input": False,
    }


# --- local JDK provider -----------------------------------------------------

def _jdk_tool(name: str) -> str | None:
    """Absolute path to `javac`/`java`, preferring JAVA_HOME over PATH."""
    java_home = os.getenv("JAVA_HOME", "").strip()
    if java_home:
        candidate = Path(java_home) / "bin" / name
        found = shutil.which(str(candidate)) or shutil.which(f"{candidate}.exe")
        if found:
            return found
    return shutil.which(name)


def local_jdk_available() -> bool:
    return bool(_jdk_tool("javac") and _jdk_tool("java"))


def _run_local(code: str, stdin: str) -> dict:
    javac, java = _jdk_tool("javac"), _jdk_tool("java")
    if not (javac and java):
        raise JavaRunnerError(
            "No Java runner is available. Install a JDK on the API host, or set "
            "PISTON_URL to a Piston instance."
        )

    class_name = main_class_name(code)
    with tempfile.TemporaryDirectory(prefix="javarun-") as workdir:
        source = Path(workdir) / f"{class_name}.java"
        source.write_text(code, encoding="utf-8")

        try:
            compiled = subprocess.run(
                [javac, "-encoding", "UTF-8", source.name],
                cwd=workdir, capture_output=True, text=True,
                encoding="utf-8", errors="replace", timeout=COMPILE_TIMEOUT_S,
            )
        except subprocess.TimeoutExpired:
            return {"output": "Error:\nThe compiler took too long. Try simplifying your code.",
                    "needs_input": False}

        if compiled.returncode != 0:
            message = (compiled.stderr or compiled.stdout or "Compilation failed.").strip()
            return {"output": f"Error:\n{_clean_stderr(message, class_name)}", "needs_input": False}

        try:
            ran = subprocess.run(
                [java, f"-Xmx{MAX_HEAP}", "-XX:+UseSerialGC", "-cp", ".", class_name],
                cwd=workdir, input=stdin, capture_output=True, text=True,
                encoding="utf-8", errors="replace", timeout=RUN_TIMEOUT_S,
            )
        except subprocess.TimeoutExpired as e:
            # Whatever it printed before we killed it is still worth showing.
            partial = e.stdout or ""
            if isinstance(partial, bytes):
                partial = partial.decode("utf-8", "replace")
            return _timeout_result(partial)

        return _classify(ran.stdout or "", ran.stderr or "", class_name)


# --- Piston provider --------------------------------------------------------

def _piston_headers() -> dict:
    return {"Authorization": PISTON_TOKEN} if PISTON_TOKEN else {}


def _java_version() -> str:
    """The Piston `version` string to request, discovered once and cached.

    Piston rejects a version it doesn't host, and instances differ, so we ask
    rather than hardcode. A failed lookup falls back to a known-good version so
    a flaky /runtimes call doesn't take the whole feature down.
    """
    global _version_cache
    if _PINNED_VERSION:
        return _PINNED_VERSION
    if _version_cache:
        return _version_cache

    version = "15.0.2"
    try:
        resp = requests.get(f"{PISTON_URL}/runtimes", headers=_piston_headers(), timeout=10)
        resp.raise_for_status()
        for runtime in resp.json():
            if runtime.get("language") == "java":
                version = runtime.get("version") or version
                break
    except (requests.RequestException, ValueError):
        pass  # keep the fallback

    _version_cache = version
    return version


def _run_piston(code: str, stdin: str) -> dict:
    if not PISTON_URL:
        raise JavaRunnerError("JAVA_RUNNER is 'piston' but PISTON_URL is not set.")

    class_name = main_class_name(code)
    payload = {
        "language": "java",
        "version": _java_version(),
        "files": [{"name": f"{class_name}.java", "content": code}],
        "stdin": stdin,
        "compile_timeout": COMPILE_TIMEOUT_S * 1000,
        "run_timeout": RUN_TIMEOUT_S * 1000,
    }
    try:
        resp = requests.post(
            f"{PISTON_URL}/execute", json=payload,
            headers=_piston_headers(), timeout=HTTP_TIMEOUT_S,
        )
    except requests.RequestException as e:
        raise JavaRunnerError(f"Could not reach the Java runner: {e}") from e

    if resp.status_code == 429:
        raise JavaRunnerError("The Java runner is busy. Wait a moment and press Run again.")
    if resp.status_code == 401:
        raise JavaRunnerError(
            "The Java runner refused the request (401). The public Piston API is "
            "whitelist-only; point PISTON_URL at your own instance."
        )
    if resp.status_code >= 400:
        raise JavaRunnerError(f"The Java runner rejected the request ({resp.status_code}).")

    try:
        result = resp.json()
    except ValueError as e:
        raise JavaRunnerError("The Java runner returned an unreadable response.") from e

    compile_stage = result.get("compile") or {}
    compile_err = (compile_stage.get("stderr") or "").strip()
    # A non-zero compile code means nothing ran; javac's message is the output.
    if compile_stage.get("code") not in (0, None) and compile_err:
        return {"output": f"Error:\n{_clean_stderr(compile_err, class_name)}", "needs_input": False}

    run_stage = result.get("run") or {}
    stdout = run_stage.get("stdout") or ""
    # Killed for running too long: Piston reports a signal rather than an error.
    if run_stage.get("signal") in ("SIGKILL", "SIGXCPU"):
        return _timeout_result(stdout)

    return _classify(stdout, run_stage.get("stderr") or "", class_name)


# --- entry point ------------------------------------------------------------

def active_provider() -> str:
    """Which provider a run would use right now: `piston` or `local`."""
    if _PROVIDER in ("piston", "local"):
        return _PROVIDER
    return "piston" if PISTON_URL else "local"


def run_java(code: str, stdin: str = "") -> dict:
    """Compile and run `code` with `stdin`, as `{"output", "needs_input"}`.

    A compile failure returns javac's message under an `Error:` header. A run
    that died reading past the end of stdin returns `needs_input: True` with the
    exception hidden, so the caller can prompt for the next line and re-run.
    """
    if active_provider() == "piston":
        return _run_piston(code, stdin)
    return _run_local(code, stdin)
