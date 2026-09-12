from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_serializer, model_validator

# Generous for a hand-written game, small enough that autosave stays cheap.
MAX_CODE_CHARS = 50_000


def as_utc(value: datetime | None) -> datetime | None:
    """Treat naive datetimes as UTC and convert aware ones to UTC.

    Postgres hands back aware values; SQLite (tests) drops the offset. Either
    way the API always speaks ISO-8601 with an explicit offset, so the browser
    never guesses at a timezone.
    """
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


class _UtcModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    @field_serializer("*", when_used="json")
    def _utc(self, value):
        return as_utc(value) if isinstance(value, datetime) else value


# --- Admin: create / edit ----------------------------------------------------

class ContestWrite(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    brief: str = Field("", max_length=20_000)
    rules: str = Field("", max_length=20_000)
    starter_code: str = Field("", max_length=MAX_CODE_CHARS)
    start_at: datetime
    end_at: datetime
    results_published: bool = False
    invite_only: bool = False

    @model_validator(mode="after")
    def _window(self):
        # Times without an offset would be read in the server's zone — refuse
        # them rather than guess. The admin form always sends UTC.
        if self.start_at.tzinfo is None or self.end_at.tzinfo is None:
            raise ValueError("start_at and end_at must include a timezone offset.")
        if self.end_at <= self.start_at:
            raise ValueError("The contest must end after it starts.")
        return self


class ContestAdmin(_UtcModel):
    id: int
    title: str
    brief: str
    rules: str
    starter_code: str
    start_at: datetime
    end_at: datetime
    results_published: bool
    invite_only: bool = False
    created_at: datetime
    entry_count: int = 0
    submitted_count: int = 0
    invite_count: int = 0


# --- Admin: running the contest ----------------------------------------------

class StartNow(BaseModel):
    """How long the contest should run from this moment.

    None keeps whatever length it was already scheduled for.
    """
    # A day is the ceiling: anything longer is a course, not a contest.
    minutes: int | None = Field(None, ge=1, le=1440)


class AddTime(BaseModel):
    """Minutes to move the deadline by. Negative shortens the contest."""
    minutes: int = Field(..., ge=-1440, le=1440)


class ResultsToggle(BaseModel):
    published: bool


# --- Student views -----------------------------------------------------------

class ContestSummary(_UtcModel):
    """A row on the contests list. No brief — that stays sealed until start."""
    id: int
    title: str
    start_at: datetime
    end_at: datetime
    status: str  # "upcoming" | "live" | "ended"
    results_published: bool
    invite_only: bool = False
    my_status: str | None = None  # None | "draft" | "submitted"


class ContestList(_UtcModel):
    server_now: datetime
    contests: list[ContestSummary]


class ContestDetail(_UtcModel):
    id: int
    title: str
    start_at: datetime
    end_at: datetime
    status: str
    results_published: bool
    invite_only: bool = False
    # Null while upcoming.
    brief: str | None = None
    rules: str | None = None
    starter_code: str | None = None
    server_now: datetime


class EntryView(_UtcModel):
    code: str
    updated_at: datetime | None = None
    submitted_at: datetime | None = None
    # Only revealed to the student once results are published.
    score: int | None = None
    judge_comment: str | None = None
    server_now: datetime


class EntrySave(BaseModel):
    code: str = Field(..., max_length=MAX_CODE_CHARS)


class LeaderboardRow(BaseModel):
    rank: int
    name: str
    score: int
    is_me: bool = False


# --- Admin: judging -----------------------------------------------------------

class EntryRow(_UtcModel):
    """Entries table row — everything but the code, which loads on open."""
    id: int
    user_id: int
    name: str
    email: str
    updated_at: datetime
    submitted_at: datetime | None = None
    score: int | None = None
    judge_comment: str | None = None
    code_length: int


class EntryDetail(EntryRow):
    code: str


class EntryScore(BaseModel):
    # None clears a score.
    score: int | None = Field(None, ge=0, le=100)
    judge_comment: str | None = Field(None, max_length=5_000)


# --- Admin: invites -----------------------------------------------------------

class InviteRow(_UtcModel):
    """One invited email, plus whether it has landed anywhere yet."""
    id: int
    email: str
    created_at: datetime
    # True once somebody has signed up with this address.
    has_account: bool = False
    # The account's display name, or None while the invite is unclaimed.
    name: str | None = None
    # True once they have saved or submitted an entry.
    has_entry: bool = False


class InviteAdd(BaseModel):
    """A paste from a class list: newlines, commas, semicolons or spaces.

    Names in angle brackets ("Ada <ada@example.com>") are tolerated because
    that is what a copied mail client row looks like.
    """
    emails: str = Field(..., max_length=20_000)


class InviteAddResult(BaseModel):
    added: list[str]
    # Already on the list; re-pasting the same class list is not an error.
    duplicates: list[str]
    # Did not look like an email address.
    invalid: list[str]
    invites: list[InviteRow]
