/**
 * terrace.tsx — Module 2: Terrace Assistant
 *
 * Extension of the existing terrace page. The form shell is preserved and
 * extended with Plant Type input. On submit, the module:
 *   1. Geocodes the city via Open-Meteo Geocoding API
 *   2. Fetches current + 5-day weather via Open-Meteo Forecast API
 *   3. Loads plant profile from /data/plant-kb.json
 *   4. Runs terraceEngine.generateTerraceRecommendations()
 *   5. Renders results with attention score, recommendations, and forecast
 *
 * Original Field, Select, PlanEmpty components are preserved exactly.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  MapPin,
  Sprout,
  Droplets,
  Leaf,
  Sparkles,
  Thermometer,
  Wind,
  Umbrella,
  Sun,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  CloudRain,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchWeatherByCity, type WeatherData, uvLabel, rainLabel } from "@/lib/weather";
import {
  generateTerraceRecommendations,
  type PlantKB,
  type PlantProfile,
  type TerraceRecommendations,
  type RecommendationUrgency,
} from "@/lib/terraceEngine";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

export const Route = createFileRoute("/terrace")({
  head: () => ({
    meta: [
      { title: "Terrace Assistant — TerraLeaf" },
      { name: "description", content: "Weather-aware daily plant care recommendations for your terrace garden." },
      { property: "og:title", content: "Terrace Assistant — TerraLeaf" },
      { property: "og:description", content: "Smart weather-based terrace gardening recommendations." },
    ],
  }),
  component: TerracePage,
});

// ── Constants ────────────────────────────────────────────────────────────────

// Plant options loaded from public/data/plant-kb.json at runtime
const PLANT_DISPLAY_ORDER = [
  "tomato", "tulsi", "money_plant", "mint", "rose", "chilli", "spinach", "basil",
];

// ── Page ─────────────────────────────────────────────────────────────────────

function TerracePage() {
  const [city, setCity] = useState("");
  const [plantKey, setPlantKey] = useState("tomato");
  const [potSize, setPotSize] = useState(""); // Optional — future ML placeholder
  const [plantAge, setPlantAge] = useState(""); // Optional — future ML placeholder
  const [plantKB, setPlantKB] = useState<PlantKB | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [recs, setRecs] = useState<TerraceRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load plant knowledge base once on mount
  useEffect(() => {
    fetch("/data/plant-kb.json")
      .then((r) => r.json())
      .then((data: PlantKB) => setPlantKB(data))
      .catch(() => setError("Failed to load plant database. Please refresh."));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plantKB) return;
    setLoading(true);
    setError("");
    setWeather(null);
    setRecs(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/terrace/recommendations?plant_type=${encodeURIComponent(plantKey)}&location=${encodeURIComponent(city)}`
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail ?? `Server error: ${res.status}`);
      }
      const data = await res.json();
      setWeather(data.weather);
      setRecs(data.recs);
    } catch (err) {
      setError((err as Error).message ?? "Failed to fetch weather. Please check the city name.");
    } finally {
      setLoading(false);
    }
  }

  const plantOptions = plantKB
    ? PLANT_DISPLAY_ORDER
        .filter((k) => plantKB[k])
        .map((k) => ({ key: k, label: `${plantKB[k].emoji} ${plantKB[k].displayName}` }))
    : [];

  return (
    <SiteLayout>
      <section className="container-px mx-auto max-w-6xl py-12 sm:py-16">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Terrace assistant</span>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Your daily smart gardening companion.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Tell us your plant and city. We'll fetch live weather and generate
            personalised care recommendations for today.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          {/* Input form */}
          <form
            id="terrace-form"
            onSubmit={handleSubmit}
            className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8"
          >
            {/* Plant Type — Required */}
            <Field icon={Sprout} label="Plant Type *">
              <select
                id="plant-select"
                required
                value={plantKey}
                onChange={(e) => setPlantKey(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {plantOptions.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </Field>

            {/* City — Required */}
            <Field icon={MapPin} label="City / Location *">
              <input
                id="city-input"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru, Mumbai, Chennai"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>

            {/* Optional fields — placeholders for future ML */}
            <div className="mb-5 rounded-2xl border border-dashed border-border bg-muted/30 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Optional (Future Personalisation)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Pot Size</label>
                  <input
                    id="pot-size-input"
                    value={potSize}
                    onChange={(e) => setPotSize(e.target.value)}
                    placeholder="e.g. 12 inch"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Plant Age</label>
                  <input
                    id="plant-age-input"
                    value={plantAge}
                    onChange={(e) => setPlantAge(e.target.value)}
                    placeholder="e.g. 3 months"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/60"
                  />
                </div>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                These fields will enhance recommendations in a future update.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              id="get-recommendations-btn"
              type="submit"
              disabled={loading || !plantKB}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Fetching weather…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Get Today's Recommendations
                </>
              )}
            </button>
          </form>

          {/* Results panel */}
          <div>
            {loading ? (
              <WeatherSkeleton />
            ) : recs && weather ? (
              <WeatherPlan weather={weather} recs={recs} />
            ) : (
              <PlanEmpty />
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

// ── Field helper (unchanged from original) ───────────────────────────────────

function Field({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </label>
      {children}
    </div>
  );
}

// ── Empty state (unchanged) ──────────────────────────────────────────────────

function PlanEmpty() {
  return (
    <div className="flex h-full flex-col justify-center rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Sprout className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold">Your care plan will appear here</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Select a plant and enter your city to get live, weather-based recommendations.
      </p>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function WeatherSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-36 rounded-3xl bg-muted" />
      <div className="h-24 rounded-3xl bg-muted" />
      <div className="h-32 rounded-3xl bg-muted" />
      <div className="h-20 rounded-3xl bg-muted" />
    </div>
  );
}

// ── Main results panel ────────────────────────────────────────────────────────

function WeatherPlan({ weather, recs }: { weather: WeatherData; recs: TerraceRecommendations }) {
  const { current, forecast, location } = weather;
  const scoreRingColor =
    recs.attentionScore >= 80
      ? "stroke-primary"
      : recs.attentionScore >= 60
      ? "stroke-amber"
      : recs.attentionScore >= 40
      ? "stroke-orange-500"
      : "stroke-destructive";

  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference * (1 - recs.attentionScore / 100);

  return (
    <div className="space-y-4 reveal-up">
      {/* Header — location + plant */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-primary-soft to-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Plant Care Forecast</span>
            <h3 className="mt-1 font-display text-xl font-bold">
              {recs.plantEmoji} {recs.plantDisplayName}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {location.displayName}, {location.country} · {current.description}
            </p>
          </div>
          {/* Attention Score ring */}
          <div className="flex flex-col items-center shrink-0">
            <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
              <circle cx="44" cy="44" r="36" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
              <circle
                cx="44" cy="44" r="36" fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={`${scoreRingColor} transition-all duration-700`}
              />
            </svg>
            <div className="-mt-[68px] flex h-[88px] flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold">{recs.attentionScore}</span>
              <span className="text-[10px] font-medium text-muted-foreground">/ 100</span>
            </div>
            <span className={`mt-1 text-[10px] font-semibold text-center leading-tight ${recs.attentionColor}`}>
              {recs.attentionLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Current conditions mini row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ConditionChip icon={Thermometer} label="Temp" value={`${current.temp}°C`} />
        <ConditionChip icon={Droplets} label="Humidity" value={`${current.humidity}%`} />
        <ConditionChip icon={CloudRain} label="Rain" value={`${current.precipitationProb}%`} sub={rainLabel(current.precipitationProb)} />
        <ConditionChip icon={Wind} label="Wind" value={`${current.windSpeed} km/h`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ConditionChip icon={Sun} label="UV Index" value={`${current.uvIndex}`} sub={uvLabel(current.uvIndex)} />
        <ConditionChip icon={Umbrella} label="Today's Watering" value={recs.wateringAdvice} small />
      </div>

      {/* Recommendations */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h4 className="font-display text-base font-semibold">Today's Recommendations</h4>
        <div className="mt-4 space-y-3">
          {recs.recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} />
          ))}
        </div>
      </div>

      {/* 5-day forecast strip */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h4 className="font-display text-base font-semibold mb-4">5-Day Forecast</h4>
        <div className="grid grid-cols-5 gap-2">
          {forecast.map((day) => (
            <div key={day.date} className="flex flex-col items-center rounded-2xl bg-muted/40 p-3 text-center">
              <span className="text-xs font-semibold text-muted-foreground">{day.dayLabel}</span>
              <span className="mt-1 text-lg">{day.precipitationProb >= 60 ? "🌧️" : day.precipitationProb >= 30 ? "🌦️" : day.uvIndex >= 7 ? "☀️" : "⛅"}</span>
              <span className="mt-1 font-display text-sm font-bold">{day.tempMax}°</span>
              <span className="text-[10px] text-muted-foreground">{day.tempMin}°</span>
              <span className="mt-1 text-[10px] text-blue-500 font-medium">{day.precipitationProb}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Condition chip ────────────────────────────────────────────────────────────

function ConditionChip({
  icon: Icon,
  label,
  value,
  sub,
  small = false,
}: {
  icon: typeof Thermometer;
  label: string;
  value: string;
  sub?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-soft">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span>{label}</span>
      </div>
      <p className={`mt-1 font-display font-bold ${small ? "text-xs leading-snug" : "text-lg"}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── Recommendation card ───────────────────────────────────────────────────────

const urgencyConfig: Record<RecommendationUrgency, { icon: React.ComponentType<{ className?: string }>; bg: string; iconColor: string }> = {
  info:     { icon: Info,         bg: "bg-primary-soft/50", iconColor: "text-primary" },
  caution:  { icon: AlertTriangle, bg: "bg-amber/10",        iconColor: "text-amber-foreground" },
  warning:  { icon: AlertTriangle, bg: "bg-orange-50",       iconColor: "text-orange-500" },
  critical: { icon: XCircle,      bg: "bg-destructive/10",   iconColor: "text-destructive" },
};

// Override for info — use CheckCircle
const infoSuccessMap: Record<string, React.ComponentType<{ className?: string }>> = {
  info: CheckCircle,
};

function RecommendationCard({ rec }: { rec: ReturnType<typeof generateTerraceRecommendations>["recommendations"][0] }) {
  const config = urgencyConfig[rec.urgency];
  const IconComp = rec.urgency === "info" ? infoSuccessMap.info : config.icon;

  return (
    <div className={`rounded-2xl p-4 ${config.bg}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 shrink-0 ${config.iconColor}`}>
          <IconComp className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base">{rec.icon}</span>
            <p className="font-display text-sm font-semibold">{rec.title}</p>
          </div>
          <p className="mt-1 text-sm text-foreground/85">{rec.action}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground italic">
            Why: {rec.reason}
          </p>
        </div>
      </div>
    </div>
  );
}
