from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field


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


class AuthResponse(BaseModel):
    """Returned by signup / login / google — a session token plus the user."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    # True when a brand-new account was just created (used to trigger the
    # first-time interests onboarding after Google sign-in).
    is_new: bool = False


class ProgressUpdate(BaseModel):
    # The full progress document the frontend wants to persist.
    progress: dict


class ProgressResponse(BaseModel):
    progress: dict
