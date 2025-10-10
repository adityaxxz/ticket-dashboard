import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db
from .auth import router as auth_router
from .routes import router as api_router
from .ws import router as ws_router, broadcast


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Ticket Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    """Health check endpoint for Render.com"""
    return {"status": "healthy", "message": "Ticket Dashboard API is running"}

@app.get("/health")
async def health():
    """Additional health check endpoint"""
    return {"status": "ok"}

app.include_router(auth_router)
app.include_router(api_router)
app.include_router(ws_router)