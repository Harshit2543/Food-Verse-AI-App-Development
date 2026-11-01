"""
Configuration module for Food Verse AI API.

Uses pydantic-settings to manage environment variables and application settings.
"""

import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    GOOGLE_API_KEY: str = ""
    UPLOAD_DIR: str = "uploads"

    # Application metadata
    APP_TITLE: str = "Food Verse AI API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Multimodal AI-powered food intelligence platform"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    return Settings()


def ensure_upload_dir() -> None:
    """Create the upload directory if it does not exist."""
    settings = get_settings()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
