/**
 * diseaseIntelEngine.ts — Rule-based disease risk engine for TerraLeaf.
 *
 * Consumes:
 *   - A disease profile from disease-kb.json
 *   - Current weather data + 5-day forecast from weather.ts
 *   - Disease name (string, matched to KB via fuzzy matching)
 *   - Detection confidence (%)
 *
 * Produces:
 *   - Spread Risk (Low / Moderate / High) with explanation
 *   - 5-day forecast risk level per day
 *   - Treatment timing recommendations
 *   - Monitoring recommendations
 *
 * All thresholds are derived from the disease knowledge base JSON.
 */

import type { WeatherData, DailyForecast } from "./weather";

// ---------------------------------------------------------------------------
// Disease KB types (mirrors public/data/disease-kb.json)
// ---------------------------------------------------------------------------

export interface DiseaseProfile {
  displayName: string;
  pathogen: string;
  type: string;
  affectedPlants: string[];
  favorableHumidityMin: number;
  favorableHumidityMax: number;
  favorableTempMin: number;
  favorableTempMax: number;
  rainSensitive: boolean;
  windSpreadRisk: "low" | "moderate" | "high";
  incubationDays: number;
  spreadSpeed: "slow" | "moderate" | "fast";
  description: string;
  treatmentWindows: {
    beforeRain: string;
    afterRain: string;
    highHumidity: string;
  };
}

export interface DiseaseKB {
  [key: string]: DiseaseProfile;
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export type SpreadRisk = "Low" | "Moderate" | "High";

export interface DayRiskForecast {
  date: string;
  dayLabel: string;
  risk: SpreadRisk;
  riskScore: number;  // 0–100, used for visual indicator
  reasons: string[];
}

export interface TreatmentTimingAdvice {
  title: string;
  action: string;
  reason: string;
  priority: "normal" | "urgent";
}

export interface MonitoringAdvice {
  action: string;
  reason: string;
}

export interface DiseaseIntelResult {
  diseaseName: string;
  diseaseDisplayName: string;
  pathogen: string;
  confidence: number;
  currentSpreadRisk: SpreadRisk;
  spreadRiskScore: number;       // 0–100
  spreadRiskExplanation: string;
  dayForecast: DayRiskForecast[];
  treatmentTiming: TreatmentTimingAdvice[];
  monitoring: MonitoringAdvice[];
  isKnownDisease: boolean;       // false when fuzzy match fails
}

// ---------------------------------------------------------------------------
// Fuzzy matching — map raw model output to KB key
// ---------------------------------------------------------------------------

export function matchDiseaseToKB(rawName: string, kb: DiseaseKB): string | null {
  const normalized = rawName.toLowerCase().replace(/[_\-\s]+/g, "_");

  // Direct key match
  if (kb[normalized]) return normalized;

  // Partial key match
  for (const key of Object.keys(kb)) {
    if (normalized.includes(key) || key.includes(normalized)) return key;
  }

  // Match on displayName
  for (const [key, profile] of Object.entries(kb)) {
    const displayNorm = profile.displayName.toLowerCase().replace(/[_\-\s]+/g, "_");
    if (normalized.includes(displayNorm) || displayNorm.includes(normalized)) return key;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Per-day risk scorer
// ---------------------------------------------------------------------------

function computeDayRisk(
  disease: DiseaseProfile,
  day: DailyForecast
): { risk: SpreadRisk; score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Humidity within favorable range
  const humidFav =
    day.humidity >= disease.favorableHumidityMin &&
    day.humidity <= disease.favorableHumidityMax;
  if (humidFav) {
    score += 35;
    reasons.push(`Humidity (${day.humidity}%) is within favorable range for this disease`);
  } else if (day.humidity > disease.favorableHumidityMax) {
    score += 15;
    reasons.push(`High humidity (${day.humidity}%) may still support spread`);
  }

  // Temperature within favorable range
  const tempFav =
    day.tempMax >= disease.favorableTempMin &&
    day.tempMax <= disease.favorableTempMax;
  if (tempFav) {
    score += 30;
    reasons.push(`Temperature (${day.tempMax}°C high) is within favorable range`);
  }

  // Rain sensitivity
  if (disease.rainSensitive && day.precipitationProb >= 50) {
    score += 25;
    reasons.push(`Rain (${day.precipitationProb}% chance) can spread spores via water splash`);
  } else if (disease.rainSensitive && day.precipitationProb >= 30) {
    score += 10;
    reasons.push(`Moderate rain probability (${day.precipitationProb}%) poses some spread risk`);
  }

  // Wind spread
  if (disease.windSpreadRisk === "high" && day.windSpeed > 20) {
    score += 15;
    reasons.push(`Wind speed (${day.windSpeed} km/h) can carry spores to nearby plants`);
  } else if (disease.windSpreadRisk === "moderate" && day.windSpeed > 30) {
    score += 8;
    reasons.push(`High winds may spread disease spores`);
  }

  const clampedScore = Math.min(100, score);

  let risk: SpreadRisk;
  if (clampedScore >= 65) risk = "High";
  else if (clampedScore >= 35) risk = "Moderate";
  else risk = "Low";

  if (reasons.length === 0) reasons.push("Conditions are unfavorable for disease spread");

  return { risk, score: clampedScore, reasons };
}

// ---------------------------------------------------------------------------
// Treatment timing advice generator
// ---------------------------------------------------------------------------

function generateTreatmentTiming(
  disease: DiseaseProfile,
  weather: WeatherData
): TreatmentTimingAdvice[] {
  const advice: TreatmentTimingAdvice[] = [];
  const { current, forecast } = weather;

  // Check if rain is coming in next 2 days
  const rainSoon = forecast.slice(0, 2).some((d) => d.precipitationProb >= 60);
  const rainToday = current.precipitationProb >= 60;
  const rainLast = forecast[0]?.precipitationProb >= 60;

  if (rainToday && disease.rainSensitive) {
    advice.push({
      title: "Delay Treatment Application",
      action: "Do not apply fungicide or treatment today.",
      reason: `Rain probability is ${current.precipitationProb}%. Rain will wash off any treatment applied today, wasting product and leaving the plant unprotected.`,
      priority: "urgent",
    });
    advice.push({
      title: "Apply Treatment After Rain Clears",
      action: `${disease.treatmentWindows.afterRain}`,
      reason: "Wait for leaves to dry completely before applying treatment for maximum adherence and efficacy.",
      priority: "normal",
    });
  } else if (rainSoon && disease.rainSensitive) {
    advice.push({
      title: "Apply Treatment Now (Before Rain)",
      action: `${disease.treatmentWindows.beforeRain}`,
      reason: "Rain is forecast within 48 hours. Apply treatment now to allow it to bond to leaf surfaces before rainfall.",
      priority: "urgent",
    });
  } else if (current.humidity > disease.favorableHumidityMin + 10) {
    advice.push({
      title: "Increase Treatment Frequency",
      action: `${disease.treatmentWindows.highHumidity}`,
      reason: `Current humidity (${current.humidity}%) creates favorable conditions for ${disease.displayName} progression. More frequent application helps stay ahead of spread.`,
      priority: "urgent",
    });
  } else {
    advice.push({
      title: "Proceed with Scheduled Treatment",
      action: "Apply your scheduled fungicide or treatment as planned.",
      reason: `Current weather conditions (${current.temp}°C, ${current.humidity}% humidity) are stable. This is a good window for treatment application.`,
      priority: "normal",
    });
  }

  // Prolonged humidity check (3+ days)
  const prolongedHumidity = forecast
    .slice(0, 4)
    .filter((d) => d.humidity > disease.favorableHumidityMin)
    .length >= 3;

  if (prolongedHumidity) {
    advice.push({
      title: "Repeat Treatment for Prolonged Humidity",
      action: `Re-apply treatment every ${disease.incubationDays + 1} days if humidity remains elevated.`,
      reason: `Forecast shows ${prolongedHumidity ? "3+" : "2"} consecutive days of high humidity. ${disease.displayName} has a ${disease.incubationDays}-day incubation period — reapplication prevents new infections.`,
      priority: "normal",
    });
  }

  return advice;
}

// ---------------------------------------------------------------------------
// Monitoring advice generator
// ---------------------------------------------------------------------------

function generateMonitoringAdvice(
  disease: DiseaseProfile,
  weather: WeatherData
): MonitoringAdvice[] {
  const advice: MonitoringAdvice[] = [];
  const recheckDays = disease.spreadSpeed === "fast" ? 2 : disease.spreadSpeed === "moderate" ? 3 : 5;

  advice.push({
    action: `Recheck affected plants every ${recheckDays} days.`,
    reason: `${disease.displayName} has a ${disease.spreadSpeed} spread speed. Early re-detection allows timely intervention before the next infection cycle.`,
  });

  advice.push({
    action: "Inspect surrounding plants of the same species.",
    reason: `${disease.displayName} affects ${disease.affectedPlants.join(", ")}. Nearby plants are at elevated risk of cross-infection${disease.windSpreadRisk === "high" ? " via airborne spores" : " via contact or soil splash"}.`,
  });

  if (disease.rainSensitive && weather.forecast.some((d) => d.precipitationProb >= 60)) {
    advice.push({
      action: "Inspect all plants within 48 hours after any rainfall.",
      reason: "Rain splash is a primary dispersal mechanism for this pathogen. Post-rain inspections catch new infections before they spread.",
    });
  }

  if (disease.windSpreadRisk === "high") {
    advice.push({
      action: "Check plants on the windward side of your terrace.",
      reason: `${disease.displayName} spreads efficiently via wind. Downwind plants are at highest risk of secondary infection.`,
    });
  }

  advice.push({
    action: "Remove and bag (do not compost) any newly infected plant material.",
    reason: "Infected material left on the soil or in compost becomes a persistent inoculum source, reinfecting plants in subsequent seasons.",
  });

  return advice;
}

// ---------------------------------------------------------------------------
// Main engine function
// ---------------------------------------------------------------------------

export function generateDiseaseIntelligence(
  rawDiseaseName: string,
  confidence: number,
  weather: WeatherData,
  kb: DiseaseKB
): DiseaseIntelResult {
  const matchedKey = matchDiseaseToKB(rawDiseaseName, kb);
  const disease = matchedKey ? kb[matchedKey] : null;

  // If disease not in KB, return a generic result
  if (!disease) {
    return buildGenericResult(rawDiseaseName, confidence, weather);
  }

  // Compute current spread risk
  const { risk: currentSpreadRisk, score: spreadRiskScore, reasons: currentReasons } =
    computeDayRisk(disease, {
      date: weather.forecast[0]?.date ?? new Date().toISOString().split("T")[0],
      dayLabel: "Today",
      tempMax: weather.current.temp,
      tempMin: weather.current.temp - 5,
      humidity: weather.current.humidity,
      precipitationProb: weather.current.precipitationProb,
      windSpeed: weather.current.windSpeed,
      uvIndex: weather.current.uvIndex,
      weatherCode: weather.current.weatherCode,
      description: weather.current.description,
    });

  const spreadRiskExplanation = currentReasons.join(". ") + ".";

  // Build 5-day forecast
  const dayForecast: DayRiskForecast[] = weather.forecast.map((day) => {
    const { risk, score, reasons } = computeDayRisk(disease, day);
    return { ...day, risk, riskScore: score, reasons };
  });

  return {
    diseaseName: rawDiseaseName,
    diseaseDisplayName: disease.displayName,
    pathogen: disease.pathogen,
    confidence,
    currentSpreadRisk,
    spreadRiskScore,
    spreadRiskExplanation,
    dayForecast,
    treatmentTiming: generateTreatmentTiming(disease, weather),
    monitoring: generateMonitoringAdvice(disease, weather),
    isKnownDisease: true,
  };
}

// ---------------------------------------------------------------------------
// Generic fallback for unknown diseases
// ---------------------------------------------------------------------------

function buildGenericResult(
  rawDiseaseName: string,
  confidence: number,
  weather: WeatherData
): DiseaseIntelResult {
  const isHumid = weather.current.humidity > 70;
  const isRainy = weather.current.precipitationProb > 50;

  const currentSpreadRisk: SpreadRisk = isHumid && isRainy ? "Moderate" : "Low";

  return {
    diseaseName: rawDiseaseName,
    diseaseDisplayName: rawDiseaseName,
    pathogen: "Unknown pathogen",
    confidence,
    currentSpreadRisk,
    spreadRiskScore: isHumid && isRainy ? 45 : 20,
    spreadRiskExplanation: isHumid
      ? `Humidity at ${weather.current.humidity}% may support disease progression. Monitor closely.`
      : "Current conditions appear relatively unfavorable for disease spread.",
    dayForecast: weather.forecast.map((day) => ({
      ...day,
      risk: day.humidity > 70 && day.precipitationProb > 50 ? "Moderate" : "Low",
      riskScore: day.humidity > 70 && day.precipitationProb > 50 ? 45 : 20,
      reasons: ["General weather assessment — specific disease data unavailable in knowledge base"],
    })),
    treatmentTiming: [
      {
        title: "Consult Specialist for Treatment Plan",
        action: "This disease is not yet in our knowledge base. Consult a local agronomist.",
        reason: "Accurate treatment timing requires knowledge of the specific pathogen's lifecycle.",
        priority: "normal",
      },
    ],
    monitoring: [
      {
        action: "Recheck affected plants every 3 days.",
        reason: "Without specific pathogen data, frequent monitoring is the safest approach.",
      },
      {
        action: "Isolate affected plant from others to prevent potential spread.",
        reason: "As a precautionary measure until the disease type is confirmed.",
      },
    ],
    isKnownDisease: false,
  };
}

// ---------------------------------------------------------------------------
// Risk color helpers
// ---------------------------------------------------------------------------

export function riskColor(risk: SpreadRisk): string {
  switch (risk) {
    case "Low": return "text-primary";
    case "Moderate": return "text-amber-foreground";
    case "High": return "text-destructive";
  }
}

export function riskBgColor(risk: SpreadRisk): string {
  switch (risk) {
    case "Low": return "bg-primary-soft text-primary";
    case "Moderate": return "bg-amber/15 text-amber-foreground";
    case "High": return "bg-destructive/15 text-destructive";
  }
}
