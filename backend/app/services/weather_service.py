"""
weather_service.py — Service layer for AccuWeather API integration.

Handles location lookup, current conditions, and 5-day forecasts.
Includes in-memory caching to optimize API quota limits and a
graceful mock fallback mechanism when API keys are missing or limits are hit.
"""

from __future__ import annotations

import logging
import time
import requests
from datetime import datetime, timedelta
from typing import Any

from app.config import ACCUWEATHER_API_KEY

logger = logging.getLogger(__name__)

# Cache configurations
WEATHER_CACHE_TTL_SECONDS = 900  # 15 minutes


class WeatherService:
    def __init__(self) -> None:
        self.api_key = ACCUWEATHER_API_KEY
        # In-memory caches
        # Format: { city_name_lower: { "key": str, "name": str, "country": str, "lat": float, "lon": float } }
        self.location_cache: dict[str, dict[str, Any]] = {}
        # Format: { location_key: { "timestamp": float, "data": dict } }
        self.weather_cache: dict[str, dict[str, Any]] = {}

    def search_location(self, city: str) -> dict[str, Any] | None:
        """
        Convert city name into AccuWeather Location details (with key).
        Checks the local cache first.
        """
        city_clean = city.strip().lower()
        if not city_clean:
            return None

        # Check cache
        if city_clean in self.location_cache:
            logger.info("Location cache hit for city: %s", city_clean)
            return self.location_cache[city_clean]

        # Check key
        if not self.api_key:
            logger.warning("No ACCUWEATHER_API_KEY configured. Using fallback location search.")
            return self._mock_location(city)

        url = "https://dataservice.accuweather.com/locations/v1/cities/search"
        params = {
            "apikey": self.api_key,
            "q": city.strip()
        }

        try:
            logger.info("Requesting AccuWeather location search for: %s", city)
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data and isinstance(data, list) and len(data) > 0:
                    first = data[0]
                    loc = {
                        "key": first.get("Key"),
                        "name": first.get("LocalizedName"),
                        "country": first.get("Country", {}).get("LocalizedName", ""),
                        "lat": first.get("GeoPosition", {}).get("Latitude", 0.0),
                        "lon": first.get("GeoPosition", {}).get("Longitude", 0.0)
                    }
                    # Cache it
                    self.location_cache[city_clean] = loc
                    return loc
                else:
                    logger.warning("AccuWeather search returned no results for: %s", city)
                    return None
            elif response.status_code == 401:
                logger.error("AccuWeather API key unauthorized (401). Falling back to mock search.")
                return self._mock_location(city)
            elif response.status_code in [429, 503]:
                logger.warning("AccuWeather request rate limit reached. Falling back to mock search.")
                return self._mock_location(city)
            else:
                logger.error("AccuWeather API error: status=%d. Falling back to mock search.", response.status_code)
                return self._mock_location(city)
        except Exception as exc:
            logger.exception("AccuWeather search connection failure. Falling back to mock search.")
            return self._mock_location(city)

    def get_weather_data(self, city: str) -> dict[str, Any]:
        """
        Retrieve combined current conditions and 5-day forecast for a city.
        Enforces caching on weather retrievals and falls back gracefully.
        """
        loc = self.search_location(city)
        if not loc:
            # If search failed completely and no fallback generated, return mock for London
            logger.warning("Search failed completely for '%s'. Defaulting to mock London weather.", city)
            loc = self._mock_location("London")

        loc_key = loc["key"]
        now = time.time()

        # Check weather cache
        if loc_key in self.weather_cache:
            cache_entry = self.weather_cache[loc_key]
            if now - cache_entry["timestamp"] < WEATHER_CACHE_TTL_SECONDS:
                logger.info("Weather cache hit for key: %s (%s)", loc_key, loc["name"])
                # Return updated fetched time but cached data
                data = dict(cache_entry["data"])
                data["fetchedAt"] = datetime.utcnow().isoformat() + "Z"
                return data

        # Fetch fresh weather data
        if not self.api_key:
            weather_data = self._generate_mock_weather(loc)
        else:
            weather_data = self._fetch_accuweather(loc)

        # Cache it if successful
        if weather_data:
            self.weather_cache[loc_key] = {
                "timestamp": now,
                "data": weather_data
            }
            return weather_data

        # Fallback to mock if fetch failed
        logger.warning("Failed to retrieve AccuWeather data for key %s. Generating mock weather.", loc_key)
        return self._generate_mock_weather(loc)

    def _fetch_accuweather(self, loc: dict[str, Any]) -> dict[str, Any] | None:
        """Call AccuWeather API endpoints and map responses to the common format."""
        loc_key = loc["key"]
        current_url = f"https://dataservice.accuweather.com/currentconditions/v1/{loc_key}"
        forecast_url = f"https://dataservice.accuweather.com/forecasts/v1/daily/5day/{loc_key}"

        try:
            # 1. Current Conditions
            logger.info("Fetching AccuWeather current conditions for key: %s", loc_key)
            c_resp = requests.get(current_url, params={"apikey": self.api_key, "details": "true"}, timeout=10)
            if c_resp.status_code != 200:
                logger.error("Current conditions API failed with code: %d", c_resp.status_code)
                return None
            c_data = c_resp.json()
            if not c_data or not isinstance(c_data, list):
                logger.error("Current conditions API returned invalid structure.")
                return None
            c_curr = c_data[0]

            # 2. 5-Day Forecast
            logger.info("Fetching AccuWeather 5-day forecast for key: %s", loc_key)
            f_resp = requests.get(
                forecast_url,
                params={"apikey": self.api_key, "details": "true", "metric": "true"},
                timeout=10
            )
            if f_resp.status_code != 200:
                logger.error("Forecast API failed with code: %d", f_resp.status_code)
                return None
            f_data = f_resp.json()

            # Map Current Conditions
            # Safely get Temperature
            temp_c = int(round(c_curr.get("Temperature", {}).get("Metric", {}).get("Value", 20.0)))
            humidity = int(c_curr.get("RelativeHumidity", 60))
            wind_speed = int(round(c_curr.get("Wind", {}).get("Speed", {}).get("Metric", {}).get("Value", 10.0)))
            uv_index = int(c_curr.get("UVIndex", 3))
            desc = c_curr.get("WeatherText", "Fair")
            weather_icon = int(c_curr.get("WeatherIcon", 1))

            # DailyForecasts list
            daily_list = f_data.get("DailyForecasts", [])
            forecasts = []

            day_labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

            # Map 5-Day forecasts
            for i, f_day in enumerate(daily_list):
                date_str = f_day.get("Date", "").split("T")[0]
                dt = datetime.strptime(date_str, "%Y-%m-%d") if date_str else datetime.utcnow() + timedelta(days=i)
                label = "Today" if i == 0 else day_labels[dt.weekday()]

                # Temperatures
                t_max = int(round(f_day.get("Temperature", {}).get("Maximum", {}).get("Value", 22.0)))
                t_min = int(round(f_day.get("Temperature", {}).get("Minimum", {}).get("Value", 15.0)))

                # Probabilities & Wind
                day_section = f_day.get("Day", {})
                night_section = f_day.get("Night", {})

                # Max rain probability of the day or night
                rain_prob = max(
                    day_section.get("RainProbability", 0),
                    night_section.get("RainProbability", 0),
                    day_section.get("PrecipitationProbability", 0)
                )

                # Wind speed in daily forecast details
                wind_speed_f = int(round(day_section.get("Wind", {}).get("Speed", {}).get("Metric", {}).get("Value", wind_speed)))

                # Find UV Index in AirAndPollen array
                uv_f = 3
                for ap in f_day.get("AirAndPollen", []):
                    if ap.get("Name") == "UVIndex":
                        uv_f = int(ap.get("Value", 3))
                        break

                icon_f = int(day_section.get("Icon", 1))
                desc_f = day_section.get("IconPhrase", "Partly Sunny")

                forecasts.append({
                    "date": date_str,
                    "dayLabel": label,
                    "tempMax": t_max,
                    "tempMin": t_min,
                    "humidity": humidity,  # AccuWeather daily forecast does not always list direct average humidity cleanly, fall back to current humidity or reasonable range
                    "precipitationProb": rain_prob,
                    "windSpeed": wind_speed_f,
                    "uvIndex": uv_f,
                    "weatherCode": icon_f,
                    "description": desc_f
                })

            # Map Today's Rain Probability from forecast first day
            today_rain = forecasts[0]["precipitationProb"] if forecasts else 0

            return {
                "location": {
                    "lat": loc["lat"],
                    "lon": loc["lon"],
                    "displayName": loc["name"],
                    "country": loc["country"]
                },
                "current": {
                    "temp": temp_c,
                    "humidity": humidity,
                    "precipitationProb": today_rain,
                    "windSpeed": wind_speed,
                    "uvIndex": uv_index,
                    "weatherCode": weather_icon,
                    "description": desc
                },
                "forecast": forecasts,
                "fetchedAt": datetime.utcnow().isoformat() + "Z"
            }

        except Exception as exc:
            logger.exception("Failed parsing AccuWeather APIs response.")
            return None

    def _mock_location(self, city: str) -> dict[str, Any]:
        """Generate a simulated Location dictionary for a given city."""
        city_title = city.strip().title()
        city_lower = city.strip().lower()

        if "mumbai" in city_lower or "india" in city_lower:
            return {"key": "mock_mumbai", "name": city_title, "country": "India", "lat": 19.076, "lon": 72.877}
        elif "london" in city_lower or "uk" in city_lower or "england" in city_lower:
            return {"key": "mock_london", "name": city_title, "country": "United Kingdom", "lat": 51.507, "lon": -0.127}
        else:
            return {"key": f"mock_{city_lower.replace(' ', '_')}", "name": city_title, "country": "Global", "lat": 40.712, "lon": -74.006}

    def _generate_mock_weather(self, loc: dict[str, Any]) -> dict[str, Any]:
        """Generate high-quality simulated weather conditions based on location profiles."""
        loc_key = loc["key"]
        day_labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        today_dt = datetime.utcnow()

        if "mumbai" in loc_key:
            # Tropical / monsoon climate
            base_temp = 31
            base_humidity = 82
            base_rain_prob = 75
            base_wind = 18
            base_uv = 10
            desc = "Tropical Showers"
            icon = 18
        elif "london" in loc_key:
            # Cool / rainy temperate climate
            base_temp = 16
            base_humidity = 68
            base_rain_prob = 45
            base_wind = 22
            base_uv = 4
            desc = "Overcast with Drizzle"
            icon = 12
        else:
            # Moderate pleasant climate
            base_temp = 24
            base_humidity = 55
            base_rain_prob = 15
            base_wind = 12
            base_uv = 6
            desc = "Partly Sunny"
            icon = 3

        forecasts = []
        for i in range(5):
            dt = today_dt + timedelta(days=i)
            # Add slight daily variation based on i
            daily_var = (i * 1.5 - 2)
            t_max = int(round(base_temp + daily_var + (1 if i % 2 == 0 else -1)))
            t_min = int(round(base_temp - 6 + daily_var))
            hum = int(round(base_humidity + (i * 2 - 3)))
            rain = int(round(base_rain_prob + (10 if i == 2 else -10 if i == 4 else 0)))
            rain = max(0, min(100, rain))
            wind = int(round(base_wind + (i - 2)))
            uv = int(max(0, base_uv + (1 if i % 3 == 0 else -1)))

            forecasts.append({
                "date": dt.strftime("%Y-%m-%d"),
                "dayLabel": "Today" if i == 0 else day_labels[dt.weekday()],
                "tempMax": t_max,
                "tempMin": t_min,
                "humidity": hum,
                "precipitationProb": rain,
                "windSpeed": wind,
                "uvIndex": uv,
                "weatherCode": icon + (i % 2),
                "description": f"Day {i+1} - {desc}" if i > 0 else desc
            })

        return {
            "location": {
                "lat": loc["lat"],
                "lon": loc["lon"],
                "displayName": loc["name"],
                "country": loc["country"]
            },
            "current": {
                "temp": base_temp,
                "humidity": base_humidity,
                "precipitationProb": base_rain_prob,
                "windSpeed": base_wind,
                "uvIndex": base_uv,
                "weatherCode": icon,
                "description": desc
            },
            "forecast": forecasts,
            "fetchedAt": today_dt.isoformat() + "Z"
        }
