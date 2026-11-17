import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./commit.db")

# Providers hand out Postgres URLs in different shapes (postgres://,
# postgresql://, postgresql+psycopg://). Normalizing them all to the
# psycopg (v3) driver means whichever one gets pasted into the environment
# variable, it matches the single driver listed in requirements.txt.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# SQLite needs this extra arg to allow use across FastAPI's request threads;
# Postgres doesn't need it at all.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
# pool_pre_ping tests a pooled connection before reusing it, reconnecting
# if it's gone stale. Harmless for SQLite; needed for Neon (and similar
# serverless Postgres providers), which close idle connections — without
# this, SQLAlchemy can hand back a dead connection and fail with
# "SSL connection has been closed unexpectedly."
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema() -> None:
    """Adds columns introduced after a table was first created.

    Base.metadata.create_all() only creates missing TABLES; it never alters
    an existing one. So when the model gains a column, a database that
    already has the table (like the live Neon one) needs it added by hand.
    This does that safely on startup, and does nothing once it's there.
    """
    from sqlalchemy import inspect, text

    # Columns added after the first release. Names and types are constants,
    # so building the ALTER statement from them is safe.
    added_columns = {
        "responded_at": "TIMESTAMP",
        "notify_phone": "VARCHAR",
        "read_at": "TIMESTAMP",
        "sent_at": "TIMESTAMP",
    }

    existing = {c["name"] for c in inspect(engine).get_columns("confessions")}
    for name, column_type in added_columns.items():
        if name not in existing:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE confessions ADD COLUMN {name} {column_type}"))
