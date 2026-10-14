"""Compiles and runs a student's C++ program.

Like Java (see `java_runner`), C++ can't run in the browser, so it goes through
the server, with the same two providers and the same `{output, needs_input}`
result shape so `useCodeRunner`'s re-run trick for interactive input works
unchanged:

  * `local`  - `g++` in a temp directory on this host. Needs a compiler
               installed (MinGW-w64 on Windows, build-essential on Linux).
  * `piston` - a self-hosted Piston instance (same one Java uses, PISTON_URL).

The same caveat as Java applies: `local` runs untrusted code on the host with a
wall-clock cap (and an address-space cap on Linux), but it is not a sandbox.

Detecting "waiting for input" is the one part Java got for free. A Java read
past the end of stdin throws; a C++ `cin >> x` just sets a fail flag and carries
on with `x = 0`, so the program would print nonsense instead of stopping. We
compile a second source file next to the learner's (`_RUNTIME`) whose static
initializer swaps `cin`'s buffer for one that, on end of input, flushes `cout`,
writes a marker to stderr and exits. That makes a C++ read behave like Python's
`input()` raising `EOFError`. Keeping it in its own file, rather than pasting it
above their code, leaves compiler messages quoting their lines unchanged.

Each re-run for another line of input would otherwise recompile the same
source, and g++ is the slow part, so compiled binaries are cached by a hash of
the source (local provider only).

Environment:
  CPP_RUNNER      `local`, `piston`, or `auto` (the default): use Piston when
                  PISTON_URL is set, otherwise the local compiler.
  CPP_VERSION     pin the Piston runtime version instead of discovering it.
  CXX             the compiler to run locally, if `g++` on PATH isn't it.
"""

import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
import threading
from collections import OrderedDict
from pathlib import Path

import requests

from app.services.java_runner import (
    HTTP_TIMEOUT_S,
    PISTON_URL,
    RUN_TIMEOUT_S,
    _piston_headers,
    _timeout_result,
    _truncate,
    _with_prefix,
)

_PINNED_VERSION = os.getenv("CPP_VERSION", "").strip()
_PROVIDER = os.getenv("CPP_RUNNER", "auto").strip().lower()

COMPILE_TIMEOUT_S = 20
# Linux only: cap the program's address space so a runaway allocation fails
# inside the program rather than taking the API host's memory with it.
MAX_MEMORY_BYTES = 256 * 1024 * 1024
CACHE_SIZE = 32

SOURCE_NAME = "main.cpp"
_EOF_MARKER = "__POCKETLAB_NEEDS_INPUT__"

# Compiled and linked alongside every program. Its own namespace and its own
# translation unit, so nothing in it can collide with what a learner writes.
RUNTIME_NAME = "pocketlab_runtime.cpp"
_RUNTIME = r"""#include <cstdio>
#include <cstdlib>
#include <iostream>
#include <streambuf>
namespace pocketlab_runner {
class StdinUntilEnd : public std::streambuf {
    char buffer_[4096];
protected:
    int_type underflow() override {
        if (gptr() < egptr()) return traits_type::to_int_type(*gptr());
        std::size_t got = std::fread(buffer_, 1, sizeof buffer_, stdin);
        if (got == 0) {
            std::cout.flush();
            std::fputs("__POCKETLAB_NEEDS_INPUT__\n", stderr);
            std::fflush(stderr);
            std::_Exit(0);
        }
        setg(buffer_, buffer_, buffer_ + got);
        return traits_type::to_int_type(*gptr());
    }
};
struct Install {
    StdinUntilEnd buf;
    Install() { std::cin.rdbuf(&buf); }
};
static Install install;
}
"""

_IS_WINDOWS = os.name == "nt"
_EXE_NAME = "main.exe" if _IS_WINDOWS else "main"

_version_cache: str | None = None


class CppRunnerError(RuntimeError):
    """No runner is available, or the one configured could not be reached."""


# --- shared helpers ---------------------------------------------------------

def _clean_stderr(text: str) -> str:
    """Drop temp directories from compiler paths so errors read `main.cpp:7:5`."""
    lines = []
    for line in text.replace("\r\n", "\n").split("\n"):
        idx = line.find(SOURCE_NAME)
        if idx > 0 and line[idx - 1] in "\\/":
            line = line[idx:]
        lines.append(line)
    return "\n".join(lines).strip()


def _crash_message(code: int) -> str:
    """Plain words for a program killed by the OS rather than ending normally."""
    if code in (-11, 3221225477):  # SIGSEGV, Windows 0xC0000005
        return ("The program crashed (segmentation fault): it read or wrote memory "
                "it doesn't own. Check array indexes and pointers.")
    if code in (-8, 3221225620):  # SIGFPE, Windows 0xC0000094
        return "The program crashed: it divided a whole number by zero."
    if code in (-6, 3221226505):  # SIGABRT, Windows 0xC0000409 (fast-fail)
        return "The program stopped itself (abort). Read the message above, if there is one."
    return f"The program stopped with exit code {code}."


def _classify(stdout: str, stderr: str, returncode: int | None) -> dict:
    """Turn a finished run's streams into the `{output, needs_input}` result."""
    if _EOF_MARKER in stderr:
        # It asked for input we don't have yet: show what it printed so far
        # (its prompt) and let the caller collect another line.
        return {"output": _truncate(stdout), "needs_input": True}
    stderr = stderr.strip()
    problem = stderr
    if returncode not in (0, None):
        # `return 1;` from main is a deliberate choice, not worth an alarm,
        # but a signal or a Windows exception code is a crash.
        if returncode < 0 or returncode > 255:
            problem = "\n".join(p for p in (stderr, _crash_message(returncode)) if p)
    if problem:
        return {"output": _truncate(_with_prefix(stdout, f"Error:\n{problem}")),
                "needs_input": False}
    return {"output": _truncate(stdout), "needs_input": False}


# --- local compiler provider ------------------------------------------------

def _compiler() -> str | None:
    configured = os.getenv("CXX", "").strip()
    if configured:
        return shutil.which(configured)
    return shutil.which("g++")


def local_compiler_available() -> bool:
    return _compiler() is not None


class _BinaryCache:
    """Compiled programs keyed by source hash, oldest evicted first."""

    def __init__(self, size: int):
        self._size = size
        self._dirs: OrderedDict[str, str] = OrderedDict()
        self._lock = threading.Lock()

    def get(self, key: str) -> Path | None:
        with self._lock:
            workdir = self._dirs.get(key)
            if workdir is None:
                return None
            self._dirs.move_to_end(key)
        exe = Path(workdir) / _EXE_NAME
        return exe if exe.exists() else None

    def put(self, key: str, workdir: str) -> None:
        evicted = []
        with self._lock:
            old = self._dirs.pop(key, None)
            if old and old != workdir:
                evicted.append(old)
            self._dirs[key] = workdir
            while len(self._dirs) > self._size:
                evicted.append(self._dirs.popitem(last=False)[1])
        for path in evicted:
            shutil.rmtree(path, ignore_errors=True)


_cache = _BinaryCache(CACHE_SIZE)


def _limit_memory():  # pragma: no cover - runs in the child process
    import resource
    resource.setrlimit(resource.RLIMIT_AS, (MAX_MEMORY_BYTES, MAX_MEMORY_BYTES))


def _compile_local(code: str) -> tuple[Path | None, str | None]:
    """The compiled program for `code`, or `(None, error message)`."""
    key = hashlib.sha256(code.encode("utf-8")).hexdigest()
    cached = _cache.get(key)
    if cached:
        return cached, None

    cxx = _compiler()
    if not cxx:
        raise CppRunnerError(
            "No C++ runner is available. Install g++ on the API host, or set "
            "PISTON_URL to a Piston instance."
        )

    workdir = tempfile.mkdtemp(prefix="cpprun-")
    (Path(workdir) / SOURCE_NAME).write_text(code, encoding="utf-8")
    (Path(workdir) / RUNTIME_NAME).write_text(_RUNTIME, encoding="utf-8")
    cmd = [cxx, "-std=c++17", "-O0", "-pipe", "-fdiagnostics-color=never",
           SOURCE_NAME, RUNTIME_NAME, "-o", _EXE_NAME]
    if _IS_WINDOWS:
        # MinGW's runtime DLLs may not be on the PATH the program runs with.
        cmd[1:1] = ["-static-libgcc", "-static-libstdc++"]
    try:
        compiled = subprocess.run(
            cmd, cwd=workdir, capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=COMPILE_TIMEOUT_S,
        )
    except subprocess.TimeoutExpired:
        shutil.rmtree(workdir, ignore_errors=True)
        return None, "The compiler took too long. Try simplifying your code."

    if compiled.returncode != 0:
        shutil.rmtree(workdir, ignore_errors=True)
        message = (compiled.stderr or compiled.stdout or "Compilation failed.").strip()
        return None, _clean_stderr(message)

    _cache.put(key, workdir)
    return Path(workdir) / _EXE_NAME, None


def _program_env() -> dict:
    """A bare environment for the learner's program.

    The API process holds secrets in its environment (database URL, signing
    keys), and `getenv` is one line of C++, so the program gets only what a
    console program needs to start.
    """
    keep = ("PATH", "SYSTEMROOT", "TEMP", "TMP") if _IS_WINDOWS else ("PATH",)
    env = {k: os.environ[k] for k in keep if k in os.environ}
    env["LANG"] = "C.UTF-8"
    return env


def _run_local(code: str, stdin: str) -> dict:
    exe, error = _compile_local(code)
    if error:
        return {"output": f"Error:\n{error}", "needs_input": False}

    try:
        ran = subprocess.run(
            [str(exe)], cwd=exe.parent, input=stdin, capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=RUN_TIMEOUT_S,
            env=_program_env(),
            preexec_fn=_limit_memory if sys.platform.startswith("linux") else None,
        )
    except subprocess.TimeoutExpired as e:
        partial = e.stdout or ""
        if isinstance(partial, bytes):
            partial = partial.decode("utf-8", "replace")
        return _timeout_result(partial)

    return _classify(ran.stdout or "", ran.stderr or "", ran.returncode)


# --- Piston provider --------------------------------------------------------

def _cpp_version() -> str:
    """The Piston `version` for C++, discovered once and cached (see Java's)."""
    global _version_cache
    if _PINNED_VERSION:
        return _PINNED_VERSION
    if _version_cache:
        return _version_cache

    version = "10.2.0"
    try:
        resp = requests.get(f"{PISTON_URL}/runtimes", headers=_piston_headers(), timeout=10)
        resp.raise_for_status()
        for runtime in resp.json():
            names = {runtime.get("language"), *(runtime.get("aliases") or [])}
            if "c++" in names or "cpp" in names:
                version = runtime.get("version") or version
                break
    except (requests.RequestException, ValueError):
        pass  # keep the fallback

    _version_cache = version
    return version


def _run_piston(code: str, stdin: str) -> dict:
    if not PISTON_URL:
        raise CppRunnerError("CPP_RUNNER is 'piston' but PISTON_URL is not set.")

    payload = {
        "language": "c++",
        "version": _cpp_version(),
        # Piston's C++ package builds every *.cpp it is given, so the runtime
        # file is linked in the same way as it is locally.
        "files": [
            {"name": SOURCE_NAME, "content": code},
            {"name": RUNTIME_NAME, "content": _RUNTIME},
        ],
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
        raise CppRunnerError(f"Could not reach the C++ runner: {e}") from e

    if resp.status_code == 429:
        raise CppRunnerError("The C++ runner is busy. Wait a moment and press Run again.")
    if resp.status_code == 401:
        raise CppRunnerError(
            "The C++ runner refused the request (401). The public Piston API is "
            "whitelist-only; point PISTON_URL at your own instance."
        )
    if resp.status_code >= 400:
        raise CppRunnerError(f"The C++ runner rejected the request ({resp.status_code}).")

    try:
        result = resp.json()
    except ValueError as e:
        raise CppRunnerError("The C++ runner returned an unreadable response.") from e

    compile_stage = result.get("compile") or {}
    compile_err = (compile_stage.get("stderr") or compile_stage.get("stdout") or "").strip()
    if compile_stage.get("code") not in (0, None):
        return {"output": f"Error:\n{_clean_stderr(compile_err) or 'Compilation failed.'}",
                "needs_input": False}

    run_stage = result.get("run") or {}
    stdout = run_stage.get("stdout") or ""
    signal = run_stage.get("signal")
    if signal in ("SIGKILL", "SIGXCPU"):
        return _timeout_result(stdout)
    returncode = run_stage.get("code")
    if signal == "SIGSEGV":
        returncode = -11
    elif signal == "SIGFPE":
        returncode = -8
    elif signal == "SIGABRT":
        returncode = -6
    return _classify(stdout, run_stage.get("stderr") or "", returncode)


# --- entry point ------------------------------------------------------------

def active_provider() -> str:
    """Which provider a run would use right now: `piston` or `local`."""
    if _PROVIDER in ("piston", "local"):
        return _PROVIDER
    return "piston" if PISTON_URL else "local"


def run_cpp(code: str, stdin: str = "") -> dict:
    """Compile and run `code` with `stdin`, as `{"output", "needs_input"}`.

    A compile failure returns g++'s message under an `Error:` header. A run that
    tried to read past the end of stdin returns `needs_input: True`, so the
    caller can prompt for the next line and re-run.
    """
    if active_provider() == "piston":
        return _run_piston(code, stdin)
    return _run_local(code, stdin)
