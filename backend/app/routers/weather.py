"""
weather.py — APIRouter defining recommendations and weather endpoints.

Exposes:
  - GET /api/weather/by-city
  - GET /api/terrace/recommendations
  - GET /api/disease-intel/risk
"""

from __future__ import annotations

import logging
from typing import Any
from fastapi import APIRouter, HTTPException, Query, status

from app.services.weather_service import WeatherService
from app.services.terrace_engine import generate_terrace_recommendations
from app.services.disease_intel_engine import generate_disease_intelligence

logger = logging.getLogger(__name__)

router = APIRouter()
weather_service = WeatherService()


@router.get(
    "/weather/by-city",
    summary="Get weather data by city",
    description="Retrieve current weather and 5-day forecast for a city using AccuWeather.",
    tags=["Weather"],
)
def get_weather_by_city(
    city: str = Query(..., description="Name of the city/location to search.")
) -> dict[str, Any]:
    try:
        return weather_service.get_weather_data(city)
    except Exception as exc:
        logger.exception("Failed fetching weather details for city: %s", city)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed retrieving weather data: {exc}",
        )


@router.get(
    "/terrace/recommendations",
    summary="Get weather-based terrace gardening recommendations",
    description="Compute plant care attention score and specific advice based on weather forecasts.",
    tags=["Terrace Assistant"],
)
def get_terrace_recommendations(
    plant_type: str = Query(..., description="Type of the plant (e.g. tomato, tulsi, rose)."),
    location: str = Query(..., description="Name of the city/location.")
) -> dict[str, Any]:
    try:
        # 1. Fetch weather
        weather_data = weather_service.get_weather_data(location)
        # 2. Compute recommendations
        recs = generate_terrace_recommendations(plant_type, weather_data)
        # Return merged results for the frontend
        return {
            "weather": weather_data,
            "recs": recs
        }
    except Exception as exc:
        logger.exception("Failed generating terrace recommendations for %s at %s", plant_type, location)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed generating care plan: {exc}",
        )


@router.get(
    "/disease-intel/risk",
    summary="Get weather-based disease spread risk and monitoring advice",
    description="Analyze spread risks and spray timings based on predicted confidence and city weather forecasts.",
    tags=["Disease Intelligence"],
)
def get_disease_intel_risk(
    disease: str = Query(..., description="Name of the predicted disease (e.g. early_blight)."),
    confidence: float = Query(..., ge=0.0, le=100.0, description="Inference prediction confidence."),
    location: str = Query(..., description="City or location name.")
) -> dict[str, Any]:
    try:
        # 1. Fetch weather
        weather_data = weather_service.get_weather_data(location)
        # 2. Run risk engine
        intel = generate_disease_intelligence(disease, confidence, weather_data)
        # Return merged results for the frontend
        return {
            "weather": weather_data,
            "result": intel
        }
    except Exception as exc:
        logger.exception("Failed generating disease intelligence risk for %s in %s", disease, location)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed computing risk analysis: {exc}",
        )
