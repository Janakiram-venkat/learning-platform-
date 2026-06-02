from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class SignInRequest(BaseModel):
    # Sign in OR sign up — we create the user if the email is new.
    email: EmailStr
    name: str


class GoogleSignInRequest(BaseModel):
    # The ID token (JWT credential) returned by Google Identity Services.
    token: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    created_at: datetime
