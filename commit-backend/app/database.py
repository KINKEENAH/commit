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
