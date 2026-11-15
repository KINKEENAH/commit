import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine, ensure_schema
from .routers import confessions
from .reminders import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_schema()
    scheduler = start_scheduler()
    yield
    scheduler.shutdown()


app = FastAPI(title="commit. API", lifespan=lifespan)

# The Vite dev server and the deployed Netlify site. Any extra origin (a
# custom domain, say) can be added without a code change by setting
# CORS_ORIGINS on the host to a comma-separated list.
origins = [
    "http://localhost:5173",
    "https://unrivaled-sopapillas-760373.netlify.app",
]
origins += [o.strip().rstrip("/") for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(confessions.router)
