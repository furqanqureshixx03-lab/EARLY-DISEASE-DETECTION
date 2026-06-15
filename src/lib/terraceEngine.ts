/**
 * terraceEngine.ts — Rule-based plant care recommendation engine for TerraLeaf.
 *
 * Consumes:
 *   - A plant profile from plant-kb.json
 *   - Current weather data from weather.ts
 *
 * Produces:
 *   - An Attention Score (0–100, higher = better / less care needed)
 *   - A list of typed Recommendations with reasons
 *
 * All scoring thresholds are derived from the plant knowledge base JSON,
 * so rules can be tuned without touching this file.
 */

import type { WeatherData } from "./weather";

// ---------------------------------------------------------------------------
// Plant KB types (mirrors public/data/plant-kb.json structure)
// ---------------------------------------------------------------------------

export interface PlantProfile {
  displayName: string;
  emoji: string;
  wateringPref: "low" | "moderate" | "high";
  heatSensitivity: "low" | "moderate" | "high";
  rainSensitivity: "low" | "moderate" | "high";
  windSensitivity: "low" | "moderate" | "high";
  optimalTempMin: number;
  optimalTempMax: number;
  optimalHumidityMin: number;
  optimalHumidityMax: number;
  droughtTolerance: "low" | "moderate" | "high";
  wateringFrequencyDays: number;
  notes: string;
}

export interface PlantKB {
  [key: string]: PlantProfile;
}

// ---------------------------------------------------------------------------
// Recommendation types
// ---------------------------------------------------------------------------

export type RecommendationCategory =
  | "watering"
  | "heat"
  | "rain"
  | "wind"
  | "uv"
  | "general";

export type RecommendationUrgency = "info" | "caution" | "warning" | "critical";

export interface Recommendation {
  category: RecommendationCategory;
  urgency: RecommendationUrgency;
  title: string;
  action: string;
  reason: string;
  icon: string;   // emoji for quick visual scanning
}

export interface TerraceRecommendations {
  attentionScore: number;         // 0–100
  attentionLabel: string;         // "Low Maintenance" | "Moderate Attention" | ...
  attentionColor: string;         // CSS color token class name
  recommendations: Recommendation[];
  wateringAdvice: string;         // single sentence summary
  plantDisplayName: string;
  plantEmoji: string;
}

// ---------------------------------------------------------------------------
// Score label helpers
// ---------------------------------------------------------------------------

function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Low Maintenance", color: "text-primary" };
  if (score >= 60) return { label: "Moderate Attention", color: "text-amber-foreground" };
  if (score >= 40) return { label: "High Attention", color: "text-orange-600" };
  return { label: "Critical Care Needed", color: "text-destructive" };
}

// ---------------------------------------------------------------------------
// Main recommendation engine
// ---------------------------------------------------------------------------

export function generateTerraceRecommendations(
  plant: PlantProfile,
  weather: WeatherData
): TerraceRecommendations {
  const { current } = weather;
  const recommendations: Recommendation[] = [];
  let score = 100;

  // ─── WATERING RULES ─────────────────────────────────────────────────────────

  const rainProb = current.precipitationProb;
  const humidity = current.humidity;

  if (rainProb >= 70) {
    // High rain probability → skip watering
    recommendations.push({
      category: "watering",
      urgency: "info",
      icon: "💧",
      title: "Skip Watering Today",
      action: "No watering needed today.",
      reason: `Rain probability is ${rainProb}%. Natural rainfall will adequately hydrate your ${plant.displayName}.`,
    });
    score -= 0; // Not a penalty — good for the plant
  } else if (rainProb >= 40) {
    // Moderate rain — light watering
    recommendations.push({
      category: "watering",
      urgency: "info",
      icon: "💧",
      title: "Light Watering Only",
      action: "Water lightly at the base in the morning.",
      reason: `There's a ${rainProb}% chance of rain today. Water conservatively to avoid overwatering your ${plant.displayName}.`,
    });
  } else if (current.temp > plant.optimalTempMax + 3 && plant.droughtTolerance === "low") {
    // Hot day + drought intolerant → increase watering
    recommendations.push({
      category: "watering",
      urgency: "caution",
      icon: "💧",
      title: "Increase Watering Frequency",
      action: `Water ${plant.displayName} twice today — morning and late afternoon.`,
      reason: `Temperature (${current.temp}°C) exceeds optimal range for ${plant.displayName} (${plant.optimalTempMax}°C max). High temperatures accelerate soil moisture loss.`,
    });
    score -= 10;
  } else if (plant.wateringPref === "high") {
    recommendations.push({
      category: "watering",
      urgency: "info",
      icon: "💧",
      title: "Normal Watering",
      action: `Water ${plant.displayName} thoroughly at the base in the morning.`,
      reason: `${plant.displayName} prefers consistent soil moisture. Water every ${plant.wateringFrequencyDays} day(s) to keep soil evenly moist.`,
    });
  } else if (plant.wateringPref === "moderate") {
    recommendations.push({
      category: "watering",
      urgency: "info",
      icon: "💧",
      title: "Normal Watering",
      action: `Water ${plant.displayName} at the base every ${plant.wateringFrequencyDays} day(s).`,
      reason: `${plant.displayName} prefers moderate, consistent moisture. Check soil moisture 2 cm deep before each watering.`,
    });
  } else {
    recommendations.push({
      category: "watering",
      urgency: "info",
      icon: "💧",
      title: "Minimal Watering",
      action: `Allow soil to dry between waterings. Water every ${plant.wateringFrequencyDays} days.`,
      reason: `${plant.displayName} has good drought tolerance. Overwatering is more harmful than underwatering for this plant.`,
    });
  }

  // ─── HEAT ALERTS ────────────────────────────────────────────────────────────

  if (current.temp > plant.optimalTempMax + 5 && plant.heatSensitivity === "high") {
    score -= 20;
    recommendations.push({
      category: "heat",
      urgency: "critical",
      icon: "🌡️",
      title: "Extreme Heat Alert",
      action: "Move pot to shade immediately. Cover with light cloth if unable to move.",
      reason: `Current temperature (${current.temp}°C) is severely above the optimal range for ${plant.displayName} (${plant.optimalTempMin}–${plant.optimalTempMax}°C). Risk of leaf scorch and wilting.`,
    });
  } else if (current.temp > plant.optimalTempMax + 2 && plant.heatSensitivity !== "low") {
    score -= 12;
    recommendations.push({
      category: "heat",
      urgency: "warning",
      icon: "🌡️",
      title: "Provide Partial Shade",
      action: "Move pot to a location that gets afternoon shade. Avoid midday direct sun.",
      reason: `Temperature (${current.temp}°C) exceeds comfortable range for ${plant.displayName}. Afternoon shade can reduce leaf surface temperature by 5–8°C.`,
    });
  } else if (current.temp < plant.optimalTempMin) {
    score -= 8;
    recommendations.push({
      category: "heat",
      urgency: "caution",
      icon: "❄️",
      title: "Low Temperature Advisory",
      action: "Bring the pot to a sheltered spot or cover at night.",
      reason: `Temperature (${current.temp}°C) is below the optimal minimum for ${plant.displayName} (${plant.optimalTempMin}°C). Cold stress can slow growth and make roots vulnerable.`,
    });
  }

  // ─── RAIN / HUMIDITY ALERTS ──────────────────────────────────────────────────

  if (rainProb >= 70 && plant.rainSensitivity === "high") {
    score -= 15;
    recommendations.push({
      category: "rain",
      urgency: "warning",
      icon: "🌧️",
      title: "Delay Fertilizer Application",
      action: "Postpone any fertilizer or pesticide application until after rain clears.",
      reason: `Rain probability is ${rainProb}% and ${plant.displayName} is sensitive to rain. Fertilizer applied before rain will be washed away and may cause root burn.`,
    });
    recommendations.push({
      category: "rain",
      urgency: "caution",
      icon: "🪴",
      title: "Avoid Repotting or Transplanting",
      action: "Postpone any repotting until weather stabilises.",
      reason: `Repotting during rainy conditions stresses roots and increases risk of fungal infections for ${plant.displayName}.`,
    });
  } else if (rainProb >= 50 && plant.rainSensitivity !== "low") {
    score -= 8;
    recommendations.push({
      category: "rain",
      urgency: "caution",
      icon: "🌧️",
      title: "Rain Alert — Monitor Drainage",
      action: "Ensure pot drainage holes are clear. Elevate pot if needed.",
      reason: `Moderate rain expected (${rainProb}% probability). Waterlogged soil can suffocate roots and promote fungal disease in ${plant.displayName}.`,
    });
  }

  if (humidity > plant.optimalHumidityMax + 10) {
    score -= 8;
    recommendations.push({
      category: "rain",
      urgency: "caution",
      icon: "💦",
      title: "High Humidity Advisory",
      action: "Space out pots to improve airflow. Remove any dead or decaying leaves.",
      reason: `Humidity at ${humidity}% exceeds comfortable range for ${plant.displayName} (${plant.optimalHumidityMax}% max). High humidity promotes fungal growth and can lead to root rot.`,
    });
  }

  // ─── WIND ALERTS ────────────────────────────────────────────────────────────

  if (current.windSpeed > 35 && plant.windSensitivity === "high") {
    score -= 15;
    recommendations.push({
      category: "wind",
      urgency: "critical",
      icon: "💨",
      title: "Secure Pots — Strong Wind Warning",
      action: "Move lightweight pots to sheltered areas. Use support sticks for tall plants.",
      reason: `Wind speed at ${current.windSpeed} km/h poses a risk of toppling pots and breaking stems of ${plant.displayName}, which is highly wind-sensitive.`,
    });
  } else if (current.windSpeed > 20 && plant.windSensitivity !== "low") {
    score -= 8;
    recommendations.push({
      category: "wind",
      urgency: "caution",
      icon: "💨",
      title: "Moderate Wind Advisory",
      action: "Check that tall stems are supported. Group pots together for mutual windbreak.",
      reason: `Wind at ${current.windSpeed} km/h can dry out soil faster and stress ${plant.displayName}. Consider temporary windbreak screening if winds persist.`,
    });
  }

  // ─── UV ALERTS ──────────────────────────────────────────────────────────────

  if (current.uvIndex >= 8) {
    score -= 10;
    recommendations.push({
      category: "uv",
      urgency: "warning",
      icon: "☀️",
      title: "Very High UV — Avoid Pruning",
      action: "Avoid pruning or transplanting today. Delay until UV drops below 6.",
      reason: `UV index is ${current.uvIndex} (Very High). Fresh pruning cuts or transplanted roots are highly vulnerable to UV damage when stress is already elevated.`,
    });
  } else if (current.uvIndex >= 6) {
    score -= 5;
    recommendations.push({
      category: "uv",
      urgency: "info",
      icon: "☀️",
      title: "High UV — Best to Work Early",
      action: "Do any garden work before 9 AM or after 5 PM.",
      reason: `UV index is ${current.uvIndex}. Both the plant and gardener benefit from avoiding peak UV exposure hours (10 AM – 4 PM).`,
    });
  }

  // ─── GENERAL POSITIVE NOTE ──────────────────────────────────────────────────

  if (score >= 85 && recommendations.length <= 2) {
    recommendations.push({
      category: "general",
      urgency: "info",
      icon: "🌿",
      title: "Ideal Growing Conditions",
      action: "Continue your regular care routine.",
      reason: `Current temperature (${current.temp}°C), humidity (${humidity}%), and weather conditions are well within the optimal range for ${plant.displayName}.`,
    });
  }

  // Clamp score to 0–100
  const finalScore = Math.max(0, Math.min(100, score));
  const { label, color } = scoreLabel(finalScore);

  // Build simple watering advice summary
  const wateringRec = recommendations.find((r) => r.category === "watering");
  const wateringAdvice = wateringRec?.action ?? `Follow standard watering schedule for ${plant.displayName}.`;

  return {
    attentionScore: finalScore,
    attentionLabel: label,
    attentionColor: color,
    recommendations,
    wateringAdvice,
    plantDisplayName: plant.displayName,
    plantEmoji: plant.emoji,
  };
}

// ---------------------------------------------------------------------------
// Watering frequency from frequency label
// ---------------------------------------------------------------------------

export function wateringFrequencyLabel(
  plant: PlantProfile,
  rainProb: number
): string {
  if (rainProb >= 70) return "Skip today";
  if (plant.wateringPref === "high") return "Daily";
  if (plant.wateringPref === "moderate") return `Every ${plant.wateringFrequencyDays} day(s)`;
  return `Every ${plant.wateringFrequencyDays}–${plant.wateringFrequencyDays + 1} days`;
}
