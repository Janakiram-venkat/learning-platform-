from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import hash_password, verify_password


def create_user_with_password(
    db: Session, email: str, name: str, password: str, interests: list[str] | None = None
) -> User:
    """Register a new email + password account.

    Returns None if the email is already taken so the caller can return 409.
    """
    email = email.strip().lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing is not None:
        return None

    user = User(
        email=email,
        name=name.strip(),
        password_hash=hash_password(password),
        interests=_clean_interests(interests),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _clean_interests(interests: list[str] | None) -> list[str]:
    """De-duplicate, trim, and drop blanks while preserving order."""
    if not interests:
        return []
    seen, cleaned = set(), []
    for item in interests:
        key = (item or "").strip()
        if key and key not in seen:
            seen.add(key)
            cleaned.append(key)
    return cleaned


def authenticate(db: Session, email: str, password: str) -> User | None:
    """Return the user if email + password are correct, else None."""
    email = email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


def google_sign_in_or_create(db: Session, email: str, name: str) -> tuple[User, bool]:
    """Find or create an account for a verified Google user.

    Google identities are trusted (the ID token is verified server-side), so
    no password is stored. If the user signs in with a new display name we
    update it. Returns (user, is_new) so the caller can trigger first-time
    onboarding when the account was just created.
    """
    email = email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    is_new = user is None

    if is_new:
        user = User(email=email, name=name.strip(), password_hash=None)
        db.add(user)
    elif name and user.name != name.strip():
        user.name = name.strip()

    db.commit()
    db.refresh(user)
    return user, is_new


def update_profile(
    db: Session,
    user: User,
    name: str | None = None,
    interests: list[str] | None = None,
) -> User:
    """Update the user's display name and/or interests in place.

    Only the fields the caller passes (non-None) are changed.
    """
    if name is not None and name.strip():
        user.name = name.strip()
    if interests is not None:
        user.interests = _clean_interests(interests)
    db.commit()
    db.refresh(user)
    return user


def set_password(db: Session, user: User, new_password: str) -> User:
    """Set (or replace) the user's local password."""
    user.password_hash = hash_password(new_password)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.strip().lower()).first()


def update_progress(db: Session, user: User, progress: dict) -> User:
    """Replace the user's stored progress document with `progress`."""
    # Reassign (don't mutate in place) so SQLAlchemy flags the JSON column dirty.
    user.progress = progress or {}
    db.commit()
    db.refresh(user)
    return user
