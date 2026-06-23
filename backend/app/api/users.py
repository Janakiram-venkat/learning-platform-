from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas.user_schema import (
    SignUpRequest,
    LoginRequest,
    GoogleSignInRequest,
    UpdateProfileRequest,
    ChangePasswordRequest,
    UserResponse,
    AuthResponse,
    ProgressUpdate,
    ProgressResponse,
)
from app.services import user_service
from app.services.google_auth import verify_google_token
from app.core.security import create_access_token, get_current_user, verify_password
from app.models.user import User

router = APIRouter()


@router.post("/auth/signup", response_model=AuthResponse, status_code=201)
def sign_up(request: SignUpRequest, db: Session = Depends(get_db)):
    """Create a new email + password account and return a session token."""
    user = user_service.create_user_with_password(
        db, request.email, request.name, request.password, request.interests
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Try logging in.",
        )
    return AuthResponse(access_token=create_access_token(user), user=user)


@router.post("/auth/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Log in with email + password. Returns a session token on success."""
    user = user_service.authenticate(db, request.email, request.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    return AuthResponse(access_token=create_access_token(user), user=user)


@router.post("/auth/google", response_model=AuthResponse)
def google_sign_in(request: GoogleSignInRequest, db: Session = Depends(get_db)):
    """Sign in with a Google ID token. Creates the account if it's new."""
    try:
        claims = verify_google_token(request.token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {exc}")

    email = claims["email"]
    name = claims.get("name") or email.split("@")[0]
    user, is_new = user_service.google_sign_in_or_create(db, email, name)
    return AuthResponse(access_token=create_access_token(user), user=user, is_new=is_new)


@router.get("/auth/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """Return the currently signed-in user (requires a valid session token)."""
    return current_user


@router.patch("/auth/profile", response_model=UserResponse)
def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the signed-in user's display name and/or interests."""
    return user_service.update_profile(
        db, current_user, request.name, request.interests
    )


@router.post("/auth/password", response_model=UserResponse)
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Set or change the signed-in user's password.

    Accounts that already have a password must supply the correct current
    password. Google-only accounts may set one for the first time without it.
    """
    if current_user.password_hash is not None:
        if not request.current_password or not verify_password(
            request.current_password, current_user.password_hash
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your current password is incorrect.",
            )
    return user_service.set_password(db, current_user, request.new_password)


@router.get("/progress", response_model=ProgressResponse)
def get_progress(current_user: User = Depends(get_current_user)):
    """Return the signed-in student's saved progress document."""
    return ProgressResponse(progress=current_user.progress or {})


@router.put("/progress", response_model=ProgressResponse)
def save_progress(
    payload: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Persist the signed-in student's progress document."""
    user = user_service.update_progress(db, current_user, payload.progress)
    return ProgressResponse(progress=user.progress or {})
