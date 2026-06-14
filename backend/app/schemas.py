"""
schemas.py — Pydantic response / error models for the TerraLeaf API.

All public endpoints use these schemas so that FastAPI can:
  - Validate and serialise responses automatically.
  - Generate accurate OpenAPI documentation.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Shared primitives
# ---------------------------------------------------------------------------


class PredictionItem(BaseModel):
    """A single class prediction with its confidence score."""

    name: str = Field(..., description="Disease class name as stored in class_indices.json.")
    confidence: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Model confidence expressed as a percentage (0–100).",
    )


class PredictionResult(BaseModel):
    """Full prediction output returned by the predictor."""

    disease: str = Field(..., description="Top-1 predicted disease label.")
    confidence: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Top-1 confidence expressed as a percentage (0–100).",
    )
    top_predictions: list[PredictionItem] = Field(
        ...,
        description="Top-K predictions sorted by confidence descending.",
    )


class RecommendationResult(BaseModel):
    """Treatment and prevention information for a detected disease."""

    severity: str = Field(..., description="Assessed severity level (e.g. Low, Moderate, High).")
    symptoms: list[str] = Field(..., description="Observable symptoms of the disease.")
    treatment: list[str] = Field(..., description="Recommended treatment actions.")
    prevention: list[str] = Field(..., description="Prevention measures to avoid recurrence.")


# ---------------------------------------------------------------------------
# Endpoint response models
# ---------------------------------------------------------------------------


class WelcomeResponse(BaseModel):
    """Response body for the root endpoint."""

    message: str = Field(default="Welcome to TerraLeaf API")


class HealthResponse(BaseModel):
    """Response body for the health-check endpoint."""

    status: str = Field(default="healthy")
    version: str = Field(default="1.0.0")
    model_loaded: bool = Field(
        ...,
        description="True when the Keras model has been successfully loaded into memory.",
    )


class PredictResponse(BaseModel):
    """Successful prediction response returned by POST /predict."""

    success: bool = Field(default=True)
    prediction: PredictionResult
    recommendation: RecommendationResult


class ErrorDetail(BaseModel):
    """Structured error payload for non-2xx responses."""

    success: bool = Field(default=False)
    error: str = Field(..., description="Human-readable error message.")
    detail: Any = Field(default=None, description="Optional additional debugging detail.")
