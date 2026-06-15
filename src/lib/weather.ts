/**
 * weather.ts — Open-Meteo weather and geocoding client for TerraLeaf.
 *
 * Uses Open-Meteo (https://open-meteo.com/) — completely free, no API key required.
 * Geocoding uses the Open-Meteo Geocoding API (also free, no key).
 *
 * Provides:
 *   - geocodeCity(city) → { lat, lon, displayName }
 *   - fetchWeather(lat, lon) → WeatherData (current + 5-day forecast)
 *   - fetchWeatherByCity(city) → WeatherData
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeoLocation {
  lat: number;
  lon: number;
  displayName: string;
  country: string;
}

export interface DailyForecast {
  date: string;           // ISO date string e.g. "2025-06-15"
  dayLabel: string;       // e.g. "Mon", "Tue"
  tempMax: number;        // °C
  tempMin: number;        // °C
  humidity: number;       // % (afternoon value)
  precipitationProb: number;  // % (max of day)
  windSpeed: number;      // km/h (max of day)
  uvIndex: number;        // 0–11+
  weatherCode: number;    // WMO weather code
  description: string;   // human-readable
}

export interface CurrentConditions {
  temp: number;           // °C
  humidity: number;       // %
  precipitationProb: number;  // %
  windSpeed: number;      // km/h
  uvIndex: number;        // 0–11+
  weatherCode: number;
  description: string;
}

export interface WeatherData {
  location: GeoLocation;
  current: CurrentConditions;
  forecast: DailyForecast[];  // 5 days including today
  fetchedAt: string;      // ISO timestamp
}

// ---------------------------------------------------------------------------
// WMO weather code → human-readable description mapping
// ---------------------------------------------------------------------------

function wmoToDescription(code: number): string {
  const map: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Icy fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    77: "Snow grains",
    80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
    85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm + hail", 99: "Thunderstorm + heavy hail",
  };
  return map[code] ?? "Unknown conditions";
}

// ---------------------------------------------------------------------------
// Geocoding — city name → coordinates
// ---------------------------------------------------------------------------

export async function geocodeCity(city: string): Promise<GeoLocation> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=en&format=json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding request failed: ${res.status}`);

  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`City not found: "${city}". Try a nearby major city or check spelling.`);
  }

  const r = data.results[0];
  return {
    lat: r.latitude,
    lon: r.longitude,
    displayName: r.name,
    country: r.country ?? "",
  };
}

// ---------------------------------------------------------------------------
// Weather fetch — lat/lon → WeatherData
// ---------------------------------------------------------------------------

export async function fetchWeather(lat: number, lon: number, location: GeoLocation): Promise<WeatherData> {
  // Request both current and daily variables from Open-Meteo.
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation_probability",
      "wind_speed_10m",
      "uv_index",
      "weather_code",
    ].join(","),
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "relative_humidity_2m_max",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "uv_index_max",
      "weather_code",
    ].join(","),
    timezone: "auto",
    forecast_days: "5",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API request failed: ${res.status}`);

  const data = await res.json();
  const c = data.current;

  // Build current conditions
  const current: CurrentConditions = {
    temp: Math.round(c.temperature_2m),
    humidity: c.relative_humidity_2m,
    precipitationProb: c.precipitation_probability ?? 0,
    windSpeed: Math.round(c.wind_speed_10m),
    uvIndex: Math.round(c.uv_index ?? 0),
    weatherCode: c.weather_code,
    description: wmoToDescription(c.weather_code),
  };

  // Build 5-day forecast
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = data.daily;
  const forecast: DailyForecast[] = d.time.map((dateStr: string, i: number) => {
    const date = new Date(dateStr);
    return {
      date: dateStr,
      dayLabel: i === 0 ? "Today" : dayLabels[date.getDay()],
      tempMax: Math.round(d.temperature_2m_max[i]),
      tempMin: Math.round(d.temperature_2m_min[i]),
      humidity: d.relative_humidity_2m_max[i],
      precipitationProb: d.precipitation_probability_max[i],
      windSpeed: Math.round(d.wind_speed_10m_max[i]),
      uvIndex: Math.round(d.uv_index_max[i]),
      weatherCode: d.weather_code[i],
      description: wmoToDescription(d.weather_code[i]),
    };
  });

  return {
    location,
    current,
    forecast,
    fetchedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Combined convenience function — city string → WeatherData
// ---------------------------------------------------------------------------

export async function fetchWeatherByCity(city: string): Promise<WeatherData> {
  const location = await geocodeCity(city);
  return fetchWeather(location.lat, location.lon, location);
}

// ---------------------------------------------------------------------------
// UV index → human label
// ---------------------------------------------------------------------------

export function uvLabel(uv: number): string {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

// ---------------------------------------------------------------------------
// Precipitation probability → risk label
// ---------------------------------------------------------------------------

export function rainLabel(prob: number): string {
  if (prob < 20) return "Low";
  if (prob < 50) return "Moderate";
  if (prob < 80) return "High";
  return "Very High";
}
