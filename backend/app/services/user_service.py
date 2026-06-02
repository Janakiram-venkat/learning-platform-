from sqlalchemy.orm import Session
from app.models.user import User


def sign_in_or_create(db: Session, email: str, name: str) -> User:
    """Look up a user by email; create them if they don't exist yet.

    This is a lightweight 'login' with no password — real auth comes later.
    If the user exists but signs in with a new display name, we update it.
    """
    email = email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if user is None:
        user = User(email=email, name=name.strip())
        db.add(user)
    elif name and user.name != name.strip():
        user.name = name.strip()

    db.commit()
    db.refresh(user)
    return user


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.strip().lower()).first()
