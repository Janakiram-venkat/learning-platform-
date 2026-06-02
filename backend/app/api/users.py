from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas.user_schema import SignInRequest, GoogleSignInRequest, UserResponse
from app.services import user_service
from app.services.google_auth import verify_google_token

router = APIRouter()


@router.post("/auth/signin", response_model=UserResponse)
def sign_in(request: SignInRequest, db: Session = Depends(get_db)):
    """Sign in with email + name. Creates the account if it's new."""
    user = user_service.sign_in_or_create(db, request.email, request.name)
    return user


@router.post("/auth/google", response_model=UserResponse)
def google_sign_in(request: GoogleSignInRequest, db: Session = Depends(get_db)):
    """Sign in with a Google ID token. Creates the account if it's new."""
    try:
        claims = verify_google_token(request.token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {exc}")

    email = claims["email"]
    name = claims.get("name") or email.split("@")[0]
    user = user_service.sign_in_or_create(db, email, name)
    return user


@router.get("/users/{email}", response_model=UserResponse)
def get_user(email: str, db: Session = Depends(get_db)):
    user = user_service.get_user_by_email(db, email)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user
