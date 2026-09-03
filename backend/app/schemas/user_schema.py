import json
from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, ConfigDict, Field, model_validator

# Maximum allowed size of the serialised progress document (512 KB).
# Protects the database from bloated or malicious payloads.
_MAX_PROGRESS_BYTES = 512 * 1024  # 512 KB

# Expected types for known progress keys. Only listed keys are validated;
# unknown keys are silently dropped by the merge endpoint, and by the
# validator below we at least ensure the well-known ones are sane.
_PROGRESS_ARRAY_KEYS = {
    "completedLessons",
    "completedAssignments",
    "completedProjects",
    "completedLabs",
    "completedGameSteps",
    "xpClaimed",
    "earnedBadges",
    "feedbackAsked",
    "aiIdeas",
}
_PROGRESS_INT_KEYS = {"totalXP"}
_PROGRESS_DICT_KEYS = {"assignmentStars", "gameMilestones"}


class SignUpRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=255)
    # bcrypt caps at 72 bytes; enforce a sensible minimum for safety.
    password: str = Field(min_length=8, max_length=72)
    # Interest topic keys the student selected (e.g. ["game-dev", "ai"]).
    interests: list[str] = Field(default_factory=list, max_length=30)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleSignInRequest(BaseModel):
    # The ID token (JWT credential) returned by Google Identity Services.
    token: str


class UpdateProfileRequest(BaseModel):
    """Edit the signed-in user's display name and/or interests.

    Fields are optional so the client can update either one independently.
    """
    name: str | None = Field(default=None, min_length=1, max_length=255)
    interests: list[str] | None = Field(default=None, max_length=30)


class ChangePasswordRequest(BaseModel):
    # Required only for accounts that already have a password. Google-only
    # accounts setting a password for the first time may omit it.
    current_password: str | None = None
    new_password: str = Field(min_length=8, max_length=72)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    interests: list[str] = []
    created_at: datetime
    # True if the account has a local password (vs. Google-only sign-in).
    has_password: bool = False
    # Staff flag — the frontend uses it to route admins to /admin. It is only
    # ever read here; nothing in the auth API can set it.
    is_admin: bool = False


class AuthResponse(BaseModel):
    """Returned by signup / login / google — a session token plus the user."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    # True when a brand-new account was just created (used to trigger the
    # first-time interests onboarding after Google sign-in).
    is_new: bool = False


def _validate_progress_shape(progress: dict) -> dict:
    """Validate and sanitise a progress document received from the client.

    - Rejects documents that serialise to more than 512 KB.
    - Checks that known keys have the expected types.
    - Returns a cleaned copy (unknown keys are retained but the known bad
      values are stripped).

    Raises ValueError (which Pydantic surfaces as a 422) on hard violations.
    """
    serialised = json.dumps(progress)
    if len(serialised.encode()) > _MAX_PROGRESS_BYTES:
        raise ValueError(
            f"Progress document exceeds the maximum allowed size "
            f"({_MAX_PROGRESS_BYTES // 1024} KB)."
        )

    cleaned: dict[str, Any] = {}
    for key, value in progress.items():
        if key in _PROGRESS_ARRAY_KEYS:
            if not isinstance(value, list):
                # Silently coerce a scalar to an empty list rather than crash.
                cleaned[key] = []
            else:
                cleaned[key] = value
        elif key in _PROGRESS_INT_KEYS:
            try:
                cleaned[key] = max(0, int(value))
            except (TypeError, ValueError):
                cleaned[key] = 0
        elif key in _PROGRESS_DICT_KEYS:
            cleaned[key] = value if isinstance(value, dict) else {}
        else:
            # Unknown key — pass through (forward-compat with new frontend keys).
            cleaned[key] = value

    return cleaned


class ProgressUpdate(BaseModel):
    """Full progress snapshot sent by PUT /progress."""
    progress: dict

    @model_validator(mode="after")
    def validate_progress(self) -> "ProgressUpdate":
        self.progress = _validate_progress_shape(self.progress)
        return self


class ProgressMerge(BaseModel):
    """Additive delta sent by PATCH /progress.

    Only the keys present in `delta` are touched; the rest of the stored
    document is left alone.
    """
    delta: dict

    @model_validator(mode="after")
    def validate_delta(self) -> "ProgressMerge":
        self.delta = _validate_progress_shape(self.delta)
        return self


class ProgressResponse(BaseModel):
    progress: dict
