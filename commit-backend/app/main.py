from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import confessions
from .reminders import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    scheduler = start_scheduler()
    yield
    scheduler.shutdown()


app = FastAPI(title="commit. API", lifespan=lifespan)

# Matches the Vite dev server. Add your real deployed frontend URL here too
# once this goes beyond local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
    "https://unrivaled-sopapillas-760373.netlify.app"],
    
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(confessions.router)
