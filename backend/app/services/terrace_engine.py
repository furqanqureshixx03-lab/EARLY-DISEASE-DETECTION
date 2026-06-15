"""
terrace_engine.py — Rule-based plant care recommendation engine.

Loads plant characteristics from plants.json and processes them
against weather forecast data.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Load plants database
_KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent / "knowledge"
_PLANTS_KB_PATH = _KNOWLEDGE_DIR / "plants.json"

try:
    with open(_PLANTS_KB_PATH, "r", encoding="utf-8") as f:
        PLANTS_KB = json.load(f)
except Exception as exc:
    logger.exception("Failed to load plants database from %s", _PLANTS_KB_PATH)
    PLANTS_KB = {}


def score_label(score: number) -> tuple[str, str]:
    """Helper to return attention label and CSS text class name."""
    if score >= 80:
        return "Low Maintenance", "text-primary"
    elif score >= 60:
        return "Moderate Attention", "text-amber-foreground"
    elif score >= 40:
        return "High Attention", "text-orange-600"
    else:
        return "Critical Care Needed", "text-destructive"


def generate_terrace_recommendations(plant_type: str, weather: dict[str, Any]) -> dict[str, Any]:
    """
    Generate care recommendations and compute attention score for a specific plant type
    given the weather conditions.
    """
    plant_type_key = plant_type.strip().lower()
    plant = PLANTS_KB.get(plant_type_key)

    # Fallback if plant doesn't exist
    if not plant:
        plant = {
            "displayName": plant_type.title(),
            "emoji": "🌿",
            "wateringPref": "moderate",
            "heatSensitivity": "moderate",
            "rainSensitivity": "moderate",
            "windSensitivity": "moderate",
            "optimalTempMin": 15,
            "optimalTempMax": 30,
            "optimalHumidityMin": 40,
            "optimalHumidityMax": 80,
            "droughtTolerance": "moderate",
            "wateringFrequencyDays": 2,
            "notes": "General crop properties applied."
        }

    current = weather["current"]
    temp = current["temp"]
    humidity = current["humidity"]
    rain_prob = current["precipitationProb"]
    wind_speed = current["windSpeed"]
    uv_index = current["uvIndex"]

    recommendations = []
    score = 100

    # ─── WATERING RULES ─────────────────────────────────────────────────────────
    if rain_prob >= 70:
        recommendations.append({
            "category": "watering",
            "urgency": "info",
            "icon": "💧",
            "title": "Skip Watering Today",
            "action": "No watering needed today.",
            "reason": f"Rain probability is {rain_prob}%. Natural rainfall will adequately hydrate your {plant['displayName']}."
        })
    elif rain_prob >= 40:
        recommendations.append({
            "category": "watering",
            "urgency": "info",
            "icon": "💧",
            "title": "Light Watering Only",
            "action": "Water lightly at the base in the morning.",
            "reason": f"There's a {rain_prob}% chance of rain today. Water conservatively to avoid overwatering your {plant['displayName']}."
        })
    elif temp > plant["optimalTempMax"] + 3 and plant["droughtTolerance"] == "low":
        score -= 10
        recommendations.append({
            "category": "watering",
            "urgency": "caution",
            "icon": "💧",
            "title": "Increase Watering Frequency",
            "action": f"Water {plant['displayName']} twice today — morning and late afternoon.",
            "reason": f"Temperature ({temp}°C) exceeds optimal range for {plant['displayName']} ({plant['optimalTempMax']}°C max). High temperatures accelerate soil moisture loss."
        })
    elif plant["wateringPref"] == "high":
        recommendations.append({
            "category": "watering",
            "urgency": "info",
            "icon": "💧",
            "title": "Normal Watering",
            "action": f"Water {plant['displayName']} thoroughly at the base in the morning.",
            "reason": f"{plant['displayName']} prefers consistent soil moisture. Water every {plant['wateringFrequencyDays']} day(s) to keep soil evenly moist."
        })
    elif plant["wateringPref"] == "moderate":
        recommendations.append({
            "category": "watering",
            "urgency": "info",
            "icon": "💧",
            "title": "Normal Watering",
            "action": f"Water {plant['displayName']} at the base every {plant['wateringFrequencyDays']} day(s).",
            "reason": f"{plant['displayName']} prefers moderate, consistent moisture. Check soil moisture 2 cm deep before each watering."
        })
    else:
        recommendations.append({
            "category": "watering",
            "urgency": "info",
            "icon": "💧",
            "title": "Minimal Watering",
            "action": f"Allow soil to dry between waterings. Water every {plant['wateringFrequencyDays']} days.",
            "reason": f"{plant['displayName']} has good drought tolerance. Overwatering is more harmful than underwatering for this plant."
        })

    # ─── HEAT ALERTS ────────────────────────────────────────────────────────────
    if temp > plant["optimalTempMax"] + 5 and plant["heatSensitivity"] == "high":
        score -= 20
        recommendations.append({
            "category": "heat",
            "urgency": "critical",
            "icon": "🌡️",
            "title": "Extreme Heat Alert",
            "action": "Move pot to shade immediately. Cover with light cloth if unable to move.",
            "reason": f"Current temperature ({temp}°C) is severely above the optimal range for {plant['displayName']} ({plant['optimalTempMin']}–{plant['optimalTempMax']}°C). Risk of leaf scorch and wilting."
        })
    elif temp > plant["optimalTempMax"] + 2 and plant["heatSensitivity"] != "low":
        score -= 12
        recommendations.append({
            "category": "heat",
            "urgency": "warning",
            "icon": "🌡️",
            "title": "Provide Partial Shade",
            "action": "Move pot to a location that gets afternoon shade. Avoid midday direct sun.",
            "reason": f"Temperature ({temp}°C) exceeds comfortable range for {plant['displayName']}. Afternoon shade can reduce leaf surface temperature by 5–8°C."
        })
    elif temp < plant["optimalTempMin"]:
        score -= 8
        recommendations.append({
            "category": "heat",
            "urgency": "caution",
            "icon": "❄️",
            "title": "Low Temperature Advisory",
            "action": "Bring the pot to a sheltered spot or cover at night.",
            "reason": f"Temperature ({temp}°C) is below the optimal minimum for {plant['displayName']} ({plant['optimalTempMin']}°C). Cold stress can slow growth and make roots vulnerable."
        })

    # ─── RAIN / HUMIDITY ALERTS ──────────────────────────────────────────────────
    if rain_prob >= 70 and plant["rainSensitivity"] == "high":
        score -= 15
        recommendations.append({
            "category": "rain",
            "urgency": "warning",
            "icon": "🌧️",
            "title": "Delay Fertilizer Application",
            "action": "Postpone any fertilizer or pesticide application until after rain clears.",
            "reason": f"Rain probability is {rain_prob}% and {plant['displayName']} is sensitive to rain. Fertilizer applied before rain will be washed away and may cause root burn."
        })
        recommendations.append({
            "category": "rain",
            "urgency": "caution",
            "icon": "🪴",
            "title": "Avoid Repotting or Transplanting",
            "action": "Postpone any repotting until weather stabilises.",
            "reason": f"Repotting during rainy conditions stresses roots and increases risk of fungal infections for {plant['displayName']}."
        })
    elif rain_prob >= 50 and plant["rainSensitivity"] != "low":
        score -= 8
        recommendations.append({
            "category": "rain",
            "urgency": "caution",
            "icon": "🌧️",
            "title": "Rain Alert — Monitor Drainage",
            "action": "Ensure pot drainage holes are clear. Elevate pot if needed.",
            "reason": f"Moderate rain expected ({rain_prob}% probability). Waterlogged soil can suffocate roots and promote fungal disease in {plant['displayName']}."
        })

    if humidity > plant["optimalHumidityMax"] + 10:
        score -= 8
        recommendations.append({
            "category": "rain",
            "urgency": "caution",
            "icon": "💦",
            "title": "High Humidity Advisory",
            "action": "Space out pots to improve airflow. Remove any dead or decaying leaves.",
            "reason": f"Humidity at {humidity}% exceeds comfortable range for {plant['displayName']} ({plant['optimalHumidityMax']}% max). High humidity promotes fungal growth and can lead to root rot."
        })

    # ─── WIND ALERTS ────────────────────────────────────────────────────────────
    if wind_speed > 35 and plant["windSensitivity"] == "high":
        score -= 15
        recommendations.append({
            "category": "wind",
            "urgency": "critical",
            "icon": "💨",
            "title": "Secure Pots — Strong Wind Warning",
            "action": "Move lightweight pots to sheltered areas. Use support sticks for tall plants.",
            "reason": f"Wind speed at {wind_speed} km/h poses a risk of toppling pots and breaking stems of {plant['displayName']}, which is highly wind-sensitive."
        })
    elif wind_speed > 20 and plant["windSensitivity"] != "low":
        score -= 8
        recommendations.append({
            "category": "wind",
            "urgency": "caution",
            "icon": "💨",
            "title": "Moderate Wind Advisory",
            "action": "Check that tall stems are supported. Group pots together for mutual windbreak.",
            "reason": f"Wind at {wind_speed} km/h can dry out soil faster and stress {plant['displayName']}. Consider temporary windbreak screening if winds persist."
        })

    # ─── UV ALERTS ──────────────────────────────────────────────────────────────
    if uv_index >= 8:
        score -= 10
        recommendations.append({
            "category": "uv",
            "urgency": "warning",
            "icon": "☀️",
            "title": "Very High UV — Avoid Pruning",
            "action": "Avoid pruning or transplanting today. Delay until UV drops below 6.",
            "reason": f"UV index is {uv_index} (Very High). Fresh pruning cuts or transplanted roots are highly vulnerable to UV damage when stress is already elevated."
        })
    elif uv_index >= 6:
        score -= 5
        recommendations.append({
            "category": "uv",
            "urgency": "info",
            "icon": "☀️",
            "title": "High UV — Best to Work Early",
            "action": "Do any garden work before 9 AM or after 5 PM.",
            "reason": f"UV index is {uv_index}. Both the plant and gardener benefit from avoiding peak UV exposure hours (10 AM – 4 PM)."
        })

    # ─── GENERAL POSITIVE NOTE ──────────────────────────────────────────────────
    if score >= 85 and len(recommendations) <= 2:
        recommendations.append({
            "category": "general",
            "urgency": "info",
            "icon": "🌿",
            "title": "Ideal Growing Conditions",
            "action": "Continue your regular care routine.",
            "reason": f"Current temperature ({temp}°C), humidity ({humidity}%), and weather conditions are well within the optimal range for {plant['displayName']}."
        })

    final_score = max(0, min(100, score))
    label, color = score_label(final_score)

    # Watering summary advice string
    watering_advice = next(
        (rec["action"] for rec in recommendations if rec["category"] == "watering"),
        f"Follow standard watering schedule for {plant['displayName']}."
    )

    return {
        "attentionScore": final_score,
        "attentionLabel": label,
        "attentionColor": color,
        "recommendations": recommendations,
        "wateringAdvice": watering_advice,
        "plantDisplayName": plant["displayName"],
        "plantEmoji": plant["emoji"]
    }
