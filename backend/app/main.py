"""
main.py — TerraLeaf FastAPI application entry point.

Responsibilities:
  - Instantiate the FastAPI application with metadata for Swagger / ReDoc.
  - Configure CORS middleware using allowed origins from config.
  - Register a lifespan context that loads model assets once at startup.
  - Define all API endpoints: GET /, GET /health, POST /predict.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import predictor
from app.config import ALLOWED_ORIGINS, APP_DESCRIPTION, APP_NAME, APP_VERSION
from app.schemas import (
    ErrorDetail,
    HealthResponse,
    PredictResponse,
    RecommendationResult,
    WelcomeResponse,
)
from app.treatments import get_treatment
from app.utils import preprocess_image, validate_upload

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — model assets are loaded exactly once at startup.
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Application lifespan handler.

    On startup: load the Keras model and class-index map into memory.
    On shutdown: log a clean shutdown message (Keras handles its own cleanup).
    """
    logger.info("Starting %s v%s …", APP_NAME, APP_VERSION)
    try:
        predictor.load_model_assets()
        logger.info("Model assets loaded — API is ready to serve requests.")
    except FileNotFoundError as exc:
        logger.error("Startup failed — model file missing: %s", exc)
        logger.error(
            "Place model.keras and class_indices.json in the models/ directory "
            "and restart the server."
        )
        # We intentionally do NOT re-raise here so the server still starts and
        # the /health endpoint can surface the degraded state to a load balancer.
    except Exception as exc:
        logger.exception("Startup failed with unexpected error: %s", exc)

    yield

    logger.info("%s shutting down.", APP_NAME)


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=APP_DESCRIPTION,
    contact={
        "name": "TerraLeaf Team",
        "url": "https://github.com/sudarshant04-droid/terraleaf-plant-health",
    },
    license_info={
        "name": "MIT",
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

logger.info("CORS enabled for origins: %s", ALLOWED_ORIGINS)


# ---------------------------------------------------------------------------
# Exception handler — converts unhandled exceptions to structured JSON.
# ---------------------------------------------------------------------------


@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorDetail(
            success=False,
            error="An unexpected internal server error occurred.",
            detail=str(exc),
        ).model_dump(),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get(
    "/",
    response_model=WelcomeResponse,
    summary="Root",
    description="Returns a welcome message confirming the API is reachable.",
    tags=["Info"],
)
async def root() -> WelcomeResponse:
    """Return a simple welcome message."""
    return WelcomeResponse(message="Welcome to TerraLeaf API")


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description=(
        "Returns the operational status of the API. "
        "The `model_loaded` field indicates whether the ML model is in memory."
    ),
    tags=["Info"],
)
async def health_check() -> HealthResponse:
    """Health-check endpoint suitable for load-balancer and deployment probes."""
    return HealthResponse(
        status="healthy",
        version=APP_VERSION,
        model_loaded=predictor.is_model_loaded(),
    )


@app.post(
    "/predict",
    response_model=PredictResponse,
    summary="Predict plant disease",
    description=(
        "Upload a leaf image (JPG or PNG, max 10 MB) as multipart/form-data "
        "using the field name **file**. Returns the predicted disease, confidence "
        "score, top-3 predictions, and structured treatment recommendations."
    ),
    tags=["Prediction"],
    responses={
        400: {"model": ErrorDetail, "description": "Invalid or empty upload / unsupported format."},
        422: {"model": ErrorDetail, "description": "Request validation error."},
        500: {"model": ErrorDetail, "description": "Internal server error or model failure."},
    },
)
async def predict(
    file: UploadFile = File(
        ...,
        description="Leaf image file. Accepted formats: JPG, JPEG, PNG.",
    ),
) -> PredictResponse:
    """
    Run plant-disease inference on the uploaded leaf image.

    Steps:
      1. Read the uploaded bytes.
      2. Validate file extension, MIME type, and size.
      3. Preprocess image (RGB conversion, resize to 224×224, normalise).
      4. Run Keras model inference.
      5. Look up treatment recommendations for the predicted disease.
      6. Return structured JSON response.
    """
    # ── 1. Guard: model must be loaded. ───────────────────────────────────────
    if not predictor.is_model_loaded():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "The prediction model is not available. "
                "Please check server logs and ensure model files exist."
            ),
        )

    # ── 2. Read upload. ────────────────────────────────────────────────────────
    try:
        image_data: bytes = await file.read()
    except Exception as exc:
        logger.exception("Failed to read uploaded file.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read the uploaded file: {exc}",
        ) from exc

    # ── 3. Validate. ───────────────────────────────────────────────────────────
    filename: str = file.filename or "upload"
    content_type: str = file.content_type or "application/octet-stream"

    try:
        validate_upload(filename=filename, content_type=content_type, data=image_data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    # ── 4. Preprocess. ─────────────────────────────────────────────────────────
    try:
        img_array = preprocess_image(image_data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    # ── 5. Inference. ──────────────────────────────────────────────────────────
    try:
        prediction_result = predictor.predict(img_array)
    except RuntimeError as exc:
        logger.exception("Prediction failed for file: %s", filename)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {exc}",
        ) from exc

    # ── 6. Treatment lookup. ───────────────────────────────────────────────────
    treatment_info = get_treatment(prediction_result.disease)

    recommendation = RecommendationResult(
        severity=treatment_info["severity"],
        symptoms=treatment_info["symptoms"],
        treatment=treatment_info["treatment"],
        prevention=treatment_info["prevention"],
    )

    logger.info(
        "Prediction: disease=%s confidence=%.2f%% file=%s",
        prediction_result.disease,
        prediction_result.confidence,
        filename,
    )

    return PredictResponse(
        success=True,
        prediction=prediction_result,
        recommendation=recommendation,
    )
