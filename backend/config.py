"""
Configuration settings for the Backtest Tool backend.

This file reads settings from the .env file and makes them
available throughout the application. Think of it as the
"settings page" for our backend server.
"""

import os
from dotenv import load_dotenv

# Load variables from .env file into the environment
# This means we can use os.getenv() to read them
load_dotenv()


class Config:
    """All configuration settings live here."""

    # --- Database ---
    # Build the database connection URL from individual pieces
    DB_HOST = os.getenv("DATABASE_HOST", "localhost")
    DB_PORT = os.getenv("DATABASE_PORT", "5432")
    DB_NAME = os.getenv("DATABASE_NAME", "backtest_tool")
    DB_USER = os.getenv("DATABASE_USER", "postgres")
    DB_PASS = os.getenv("DATABASE_PASSWORD", "password")

    # Full connection string that SQLAlchemy/psycopg2 uses
    DATABASE_URL = (
        f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

    # --- Flask ---
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"

    # --- CORS ---
    # Which frontend URLs are allowed to call our API
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000")
