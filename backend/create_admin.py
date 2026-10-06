"""Create (or reset) the admin account for the /admin dashboard.

Run from the backend/ directory with the project venv:
    venv/Scripts/python create_admin.py

Credentials come from backend/.env if present, otherwise the defaults below:
    ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD

Safe to re-run — it updates the existing account in place, which also makes it
the way to reset a forgotten admin password. Promoting an existing student works
too: pass their email as ADMIN_EMAIL and they keep their progress.
"""
import os
import sys
from pathlib import Path

# Make `app` importable when run from backend/.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(Path(__file__).resolve().parent / ".env")

from sqlalchemy import text  # noqa: E402

from app.db import SessionLocal, engine  # noqa: E402
from app.models.user import User  # noqa: E402
from app.core.security import hash_password  # noqa: E402

EMAIL = os.getenv("ADMIN_EMAIL", "admin@pocketlab.dev").strip().lower()
NAME = os.getenv("ADMIN_NAME", "Pocket Lab Admin")
PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@Pocket2026")


def main() -> None:
    # The column may not exist yet if the API hasn't booted since the upgrade.
    with engine.begin() as conn:
        conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE")
        )

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == EMAIL).first()
        if user is None:
            user = User(
                email=EMAIL,
                name=NAME,
                password_hash=hash_password(PASSWORD),
                interests=[],
                progress={},
                is_admin=True,
            )
            db.add(user)
            action = "Created"
        else:
            user.name = NAME
            user.password_hash = hash_password(PASSWORD)
            user.is_admin = True
            action = "Updated"
        db.commit()
        db.refresh(user)

        print(f"\n{action} admin account (id={user.id})")
        print("-" * 44)
        print(f"  Email:    {EMAIL}")
        print(f"  Password: {PASSWORD}")
        print("  Sign in on the site — you'll land on /admin.")
        print("-" * 44)
        print("Change the password from Settings after the first sign-in,")
        print("or set ADMIN_PASSWORD in backend/.env and re-run this script.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
