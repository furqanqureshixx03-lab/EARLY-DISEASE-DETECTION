"""
disease_intel_engine.py — Weather-aware disease intelligence risk engine.

Processes disease attributes from diseases.json against the forecast to compute
spread risk levels, treatment timings, and monitoring advices.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Load diseases database
_KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent / "knowledge"
_DISEASES_KB_PATH = _KNOWLEDGE_DIR / "diseases.json"

try:
    with open(_DISEASES_KB_PATH, "r", encoding="utf-8") as f:
        DISEASES_KB = json.load(f)
except Exception as exc:
    logger.exception("Failed to load diseases database from %s", _DISEASES_KB_PATH)
    DISEASES_KB = {}


def match_disease_to_kb(raw_name: str) -> str | None:
    """Fuzzy matching logic to map raw output name to diseases.json key."""
    if not raw_name:
        return None

    normalized = raw_name.lower().replace("\u2014", "_").replace("-", "_").replace(" ", "_")

    # Direct match
    if normalized in DISEASES_KB:
        return normalized

    # Partial match on keys
    for key in DISEASES_KB:
        if normalized in key or key in normalized:
            return key

    # Match on display name
    for key, profile in DISEASES_KB.items():
        disp_normalized = profile.get("displayName", "").lower().replace("-", "_").replace(" ", "_")
        if normalized in disp_normalized or disp_normalized in normalized:
            return key

    return None


def compute_day_risk(disease: dict[str, Any], day: dict[str, Any]) -> dict[str, Any]:
    """Compute risk score and compile reasons for a specific day forecast."""
    score = 0
    reasons = []

    humidity = day.get("humidity", 50)
    temp_max = day.get("tempMax", 20)
    rain_prob = day.get("precipitationProb", 0)
    wind_speed = day.get("windSpeed", 10)

    fav_humid_min = disease.get("favorableHumidityMin", 70)
    fav_humid_max = disease.get("favorableHumidityMax", 100)
    fav_temp_min = disease.get("favorableTempMin", 20)
    fav_temp_max = disease.get("favorableTempMax", 30)

    # 1. Humidity
    if humidity >= fav_humid_min and humidity <= fav_humid_max:
        score += 35
        reasons.append(f"Humidity ({humidity}%) is within favorable range for this disease")
    elif humidity > fav_humid_max:
        score += 15
        reasons.append(f"High humidity ({humidity}%) may still support spread")

    # 2. Temperature
    if temp_max >= fav_temp_min and temp_max <= fav_temp_max:
        score += 30
        reasons.append(f"Temperature ({temp_max}°C high) is within favorable range")

    # 3. Rain Sensitivity
    if disease.get("rainSensitive", False):
        if rain_prob >= 50:
            score += 25
            reasons.append(f"Rain ({rain_prob}% chance) can spread spores via water splash")
        elif rain_prob >= 30:
            score += 10
            reasons.append(f"Moderate rain probability ({rain_prob}%) poses some spread risk")

    # 4. Wind Spread
    wind_spread = disease.get("windSpreadRisk", "low")
    if wind_spread == "high" and wind_speed > 20:
        score += 15
        reasons.append(f"Wind speed ({wind_speed} km/h) can carry spores to nearby plants")
    elif wind_spread == "moderate" and wind_speed > 30:
        score += 8
        reasons.append("High winds may spread disease spores")

    clamped_score = min(100, score)

    if clamped_score >= 65:
        risk = "High"
    elif clamped_score >= 35:
        risk = "Moderate"
    else:
        risk = "Low"

    if not reasons:
        reasons.append("Conditions are unfavorable for disease spread")

    return {
        "risk": risk,
        "score": clamped_score,
        "reasons": reasons
    }


def generate_treatment_timing(disease: dict[str, Any], weather: dict[str, Any]) -> list[dict[str, Any]]:
    """Generate treatment timing recommendations based on weather forecast."""
    advice = []
    current = weather["current"]
    forecast = weather["forecast"]

    # Check if rain is coming in next 2 days
    rain_soon = any(day.get("precipitationProb", 0) >= 60 for day in forecast[:2])
    rain_today = current.get("precipitationProb", 0) >= 60

    fav_humid_min = disease.get("favorableHumidityMin", 70)
    incubation_days = disease.get("incubationDays", 3)
    windows = disease.get("treatmentWindows", {})

    if rain_today and disease.get("rainSensitive", False):
        advice.append({
            "title": "Delay Treatment Application",
            "action": "Do not apply fungicide or treatment today.",
            "reason": f"Rain probability is {current.get('precipitationProb')}%. Rain will wash off any treatment applied today, wasting product and leaving the plant unprotected.",
            "priority": "urgent"
        })
        advice.append({
            "title": "Apply Treatment After Rain Clears",
            "action": windows.get("afterRain", "Reapply fungicide after rain clears."),
            "reason": "Wait for leaves to dry completely before applying treatment for maximum adherence and efficacy.",
            "priority": "normal"
        })
    elif rain_soon and disease.get("rainSensitive", False):
        advice.append({
            "title": "Apply Treatment Now (Before Rain)",
            "action": windows.get("beforeRain", "Apply preventive treatment before rain."),
            "reason": "Rain is forecast within 48 hours. Apply treatment now to allow it to bond to leaf surfaces before rainfall.",
            "priority": "urgent"
        })
    elif current.get("humidity", 60) > fav_humid_min + 10:
        advice.append({
            "title": "Increase Treatment Frequency",
            "action": windows.get("highHumidity", "Increase spray frequency under high humidity."),
            "reason": f"Current humidity ({current.get('humidity')}%) creates favorable conditions for {disease.get('displayName')} progression. More frequent application helps stay ahead of spread.",
            "priority": "urgent"
        })
    else:
        advice.append({
            "title": "Proceed with Scheduled Treatment",
            "action": "Apply your scheduled fungicide or treatment as planned.",
            "reason": f"Current weather conditions ({current.get('temp')}°C, {current.get('humidity')}% humidity) are stable. This is a good window for treatment application.",
            "priority": "normal"
        })

    # Prolonged humidity (3+ days of the first 4 days above fav_humid_min)
    prolonged_humidity = sum(1 for day in forecast[:4] if day.get("humidity", 50) > fav_humid_min) >= 3
    if prolonged_humidity:
        advice.append({
            "title": "Repeat Treatment for Prolonged Humidity",
            "action": f"Re-apply treatment every {incubation_days + 1} days if humidity remains elevated.",
            "reason": f"Forecast shows {'3+' if prolonged_humidity else '2'} consecutive days of high humidity. {disease.get('displayName')} has a {incubation_days}-day incubation period — reapplication prevents new infections.",
            "priority": "normal"
        })

    return advice


def generate_monitoring_advice(disease: dict[str, Any], weather: dict[str, Any]) -> list[dict[str, Any]]:
    """Compile monitoring advice based on disease type and weather outlook."""
    advice = []
    forecast = weather["forecast"]

    speed = disease.get("spreadSpeed", "moderate")
    recheck_days = 2 if speed == "fast" else 3 if speed == "moderate" else 5
    affected_plants = ", ".join(disease.get("affectedPlants", ["Tomato"]))

    advice.append({
        "action": f"Recheck affected plants every {recheck_days} days.",
        "reason": f"{disease.get('displayName')} has a {speed} spread speed. Early re-detection allows timely intervention before the next infection cycle."
    })

    wind_risk_str = " via airborne spores" if disease.get("windSpreadRisk") == "high" else " via contact or soil splash"
    advice.append({
        "action": "Inspect surrounding plants of the same species.",
        "reason": f"{disease.get('displayName')} affects {affected_plants}. Nearby plants are at elevated risk of cross-infection{wind_risk_str}."
    })

    if disease.get("rainSensitive", False) and any(day.get("precipitationProb", 0) >= 60 for day in forecast):
        advice.append({
            "action": "Inspect all plants within 48 hours after any rainfall.",
            "reason": "Rain splash is a primary dispersal mechanism for this pathogen. Post-rain inspections catch new infections before they spread."
        })

    if disease.get("windSpreadRisk") == "high":
        advice.append({
            "action": "Check plants on the windward side of your terrace.",
            "reason": f"{disease.get('displayName')} spreads efficiently via wind. Downwind plants are at highest risk of secondary infection."
        })

    advice.append({
        "action": "Remove and bag (do not compost) any newly infected plant material.",
        "reason": "Infected material left on the soil or in compost becomes a persistent inoculum source, reinfecting plants in subsequent seasons."
    })

    return advice


def generate_disease_intelligence(raw_name: str, confidence: float, weather: dict[str, Any]) -> dict[str, Any]:
    """Main execution engine: compute risk index, daily forecast, and recommendations."""
    matched_key = match_disease_to_kb(raw_name)
    disease = DISEASES_KB.get(matched_key) if matched_key else None

    if not disease:
        return _build_generic_result(raw_name, confidence, weather)

    # Today's conditions mapped to forecast[0] values
    today_forecast = {
        "date": weather["forecast"][0]["date"] if weather["forecast"] else "",
        "dayLabel": "Today",
        "tempMax": weather["current"]["temp"],
        "tempMin": weather["current"]["temp"] - 5,
        "humidity": weather["current"]["humidity"],
        "precipitationProb": weather["current"]["precipitationProb"],
        "windSpeed": weather["current"]["windSpeed"],
        "uvIndex": weather["current"]["uvIndex"],
        "weatherCode": weather["current"]["weatherCode"],
        "description": weather["current"]["description"]
    }

    current_risk_res = compute_day_risk(disease, today_forecast)
    current_spread_risk = current_risk_res["risk"]
    spread_risk_score = current_risk_res["score"]
    spread_risk_explanation = ". ".join(current_risk_res["reasons"]) + "."

    # 5-Day forecast daily risk mapping
    day_forecast = []
    for day in weather["forecast"]:
        res = compute_day_risk(disease, day)
        day_forecast.append({
            "date": day["date"],
            "dayLabel": day["dayLabel"],
            "risk": res["risk"],
            "riskScore": res["score"],
            "reasons": res["reasons"],
            "tempMax": day["tempMax"],
            "tempMin": day["tempMin"],
            "humidity": day["humidity"],
            "precipitationProb": day["precipitationProb"],
            "windSpeed": day["windSpeed"],
            "uvIndex": day["uvIndex"],
            "weatherCode": day["weatherCode"],
            "description": day["description"]
        })

    return {
        "diseaseName": raw_name,
        "diseaseDisplayName": disease["displayName"],
        "pathogen": disease["pathogen"],
        "confidence": confidence,
        "currentSpreadRisk": current_spread_risk,
        "spreadRiskScore": spread_risk_score,
        "spreadRiskExplanation": spread_risk_explanation,
        "dayForecast": day_forecast,
        "treatmentTiming": generate_treatment_timing(disease, weather),
        "monitoring": generate_monitoring_advice(disease, weather),
        "isKnownDisease": True
    }


def _build_generic_result(raw_name: str, confidence: float, weather: dict[str, Any]) -> dict[str, Any]:
    """Generates a fallback evaluation for unrecognized disease classifications."""
    is_humid = weather["current"]["humidity"] > 70
    is_rainy = weather["current"]["precipitationProb"] > 50

    current_spread_risk = "Moderate" if (is_humid and is_rainy) else "Low"
    spread_risk_score = 45 if (is_humid and is_rainy) else 20
    explanation = (
        f"Humidity at {weather['current']['humidity']}% may support disease progression. Monitor closely."
        if is_humid else
        "Current conditions appear relatively unfavorable for disease spread."
    )

    day_forecast = []
    for day in weather["forecast"]:
        humid_day = day.get("humidity", 50) > 70
        rainy_day = day.get("precipitationProb", 0) > 50
        risk = "Moderate" if (humid_day and rainy_day) else "Low"
        score = 45 if (humid_day and rainy_day) else 20

        day_forecast.append({
            "date": day["date"],
            "dayLabel": day["dayLabel"],
            "risk": risk,
            "riskScore": score,
            "reasons": ["General weather assessment — specific disease data unavailable in knowledge base"],
            "tempMax": day["tempMax"],
            "tempMin": day["tempMin"],
            "humidity": day.get("humidity", 50),
            "precipitationProb": day.get("precipitationProb", 0),
            "windSpeed": day.get("windSpeed", 10),
            "uvIndex": day.get("uvIndex", 3),
            "weatherCode": day.get("weatherCode", 1),
            "description": day.get("description", "")
        })

    return {
        "diseaseName": raw_name,
        "diseaseDisplayName": raw_name.replace("___", " — ").replace("_", " ").title(),
        "pathogen": "Unknown pathogen",
        "confidence": confidence,
        "currentSpreadRisk": current_spread_risk,
        "spreadRiskScore": spread_risk_score,
        "spreadRiskExplanation": explanation,
        "dayForecast": day_forecast,
        "treatmentTiming": [
            {
                "title": "Consult Specialist for Treatment Plan",
                "action": "This disease is not yet in our knowledge base. Consult a local agronomist.",
                "reason": "Accurate treatment timing requires knowledge of the specific pathogen's lifecycle.",
                "priority": "normal"
            }
        ],
        "monitoring": [
            {
                "action": "Recheck affected plants every 3 days.",
                "reason": "Without specific pathogen data, frequent monitoring is the safest approach."
            },
            {
                "action": "Isolate affected plant from others to prevent potential spread.",
                "reason": "As a precautionary measure until the disease type is confirmed."
            }
        ],
        "isKnownDisease": False
    }
