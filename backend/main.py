"""
Main entry point for Food Verse AI backend API.

Initializes FastAPI application, mounts CORS, registers routers,
and serves health check and static endpoints.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

from config import get_settings, ensure_upload_dir
from routers import (
    food_recognition,
    freshness_detection,
    hygiene_monitor,
    cooking_assistant,
    nutrition_planner,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events handler for FastAPI."""
    ensure_upload_dir()
    yield


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api
app.include_router(food_recognition.router, prefix="/api")
app.include_router(freshness_detection.router, prefix="/api")
app.include_router(hygiene_monitor.router, prefix="/api")
app.include_router(cooking_assistant.router, prefix="/api")
app.include_router(nutrition_planner.router, prefix="/api")

# Static files for uploads
uploads_path = os.path.abspath(settings.UPLOAD_DIR)
os.makedirs(uploads_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint welcoming users to Food Verse AI API."""
    return {
        "name": settings.APP_TITLE,
        "version": settings.APP_VERSION,
        "description": settings.APP_DESCRIPTION,
        "docs_url": "/docs",
        "status": "online",
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify system status."""
    return {
        "status": "healthy",
        "service": settings.APP_TITLE,
        "version": settings.APP_VERSION,
        "ai_configured": bool(settings.GOOGLE_API_KEY),
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
