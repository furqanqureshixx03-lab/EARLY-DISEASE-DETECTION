"""
config.py — TerraLeaf API configuration.

All runtime settings are read from environment variables (with sensible defaults).
Drop a `.env` file next to this package to override values during local development.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Resolve the project root (one level above this file's package directory).
_BASE_DIR: Path = Path(__file__).resolve().parent.parent

# Load .env from the project root, if it exists.  Never raises.
load_dotenv(dotenv_path=_BASE_DIR / ".env", override=False)


def _get(key: str, default: str) -> str:
    """Return env-var *key* stripped of whitespace, falling back to *default*."""
    return os.environ.get(key, default).strip()


# ---------------------------------------------------------------------------
# Application metadata
# ---------------------------------------------------------------------------

APP_NAME: str = _get("APP_NAME", "TerraLeaf API")
APP_ENV: str = _get("APP_ENV", "development")
APP_VERSION: str = _get("APP_VERSION", "1.0.0")
APP_DESCRIPTION: str = (
    "AI-powered plant disease detection API. "
    "Upload a leaf image and receive an instant diagnosis with treatment recommendations."
)

# ---------------------------------------------------------------------------
# Model paths (resolved relative to the project root for portability)
# ---------------------------------------------------------------------------

MODEL_PATH: Path = _BASE_DIR / _get("MODEL_PATH", "models/plant_disease_model.keras")
CLASS_MAP_PATH: Path = _BASE_DIR / _get("CLASS_MAP_PATH", "models/class_names.json")

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

_raw_origins: str = _get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173",
)
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# ---------------------------------------------------------------------------
# Weather API
# ---------------------------------------------------------------------------

ACCUWEATHER_API_KEY: str = os.environ.get("ACCUWEATHER_API_KEY", "").strip()


# ---------------------------------------------------------------------------
# Image preprocessing
# ---------------------------------------------------------------------------

IMAGE_SIZE: tuple[int, int] = (224, 224)
TOP_K_PREDICTIONS: int = 3

# ---------------------------------------------------------------------------
# Upload validation
# ---------------------------------------------------------------------------

ALLOWED_CONTENT_TYPES: frozenset[str] = frozenset(
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
    }
)
ALLOWED_EXTENSIONS: frozenset[str] = frozenset({".jpg", ".jpeg", ".png"})
MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
