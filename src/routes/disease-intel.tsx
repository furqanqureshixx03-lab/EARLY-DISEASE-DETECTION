/**
 * disease-intel.tsx — Module 3: Disease Intelligence
 *
 * Weather-aware disease guidance page. Does NOT re-run disease prediction.
 * Instead it enhances an already-detected disease with forecast information.
 *
 * Route: /disease-intel
 * Search params: ?disease=<name>&confidence=<number> (pre-filled from detect page)
 *
 * Flow:
 *   1. User provides disease name + confidence + city
 *   2. Fetch weather via Open-Meteo
 *   3. Load disease-kb.json
 *   4. Run diseaseIntelEngine.generateDiseaseIntelligence()
 *   5. Render spread risk, 5-day risk forecast, treatment timing, monitoring
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  MapPin,
  Brain,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Eye,
  TrendingUp,
  Clock,
  CloudRain,
  Thermometer,
  Droplets,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchWeatherByCity, type WeatherData } from "@/lib/weather";
import {
  generateDiseaseIntelligence,
  type DiseaseKB,
  type DiseaseIntelResult,
  type SpreadRisk,
  riskBgColor,
  riskColor,
} from "@/lib/diseaseIntelEngine";

// ── Route definition ─────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

export const Route = createFileRoute("/disease-intel")({
  validateSearch: (search: Record<string, unknown>) => ({
    disease: (search.disease as string) ?? "",
    confidence: Number(search.confidence) || 0,
  }),
  head: () => ({
    meta: [
      { title: "Disease Intelligence — TerraLeaf" },
      { name: "description", content: "Weather-aware disease spread risk analysis and treatment timing recommendations." },
      { property: "og:title", content: "Disease Intelligence — TerraLeaf" },
      { property: "og:description", content: "Forecast-based disease progression analysis for smarter plant care decisions." },
    ],
  }),
  component: DiseaseIntelPage,
});

// ── Page ─────────────────────────────────────────────────────────────────────

function DiseaseIntelPage() {
  const { disease: prefillDisease, confidence: prefillConfidence } = Route.useSearch();

  const [diseaseName, setDiseaseName] = useState(
    prefillDisease
      ? prefillDisease.replace(/___/g, " — ").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : ""
  );
  const [confidence, setConfidence] = useState(prefillConfidence || 0);
  const [city, setCity] = useState("");
  const [diseaseKB, setDiseaseKB] = useState<DiseaseKB | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [result, setResult] = useState<DiseaseIntelResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load disease knowledge base on mount
  useEffect(() => {
    fetch("/data/disease-kb.json")
      .then((r) => r.json())
      .then((data: DiseaseKB) => setDiseaseKB(data))
      .catch(() => setError("Failed to load disease database. Please refresh."));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!diseaseKB) return;
    setLoading(true);
    setError("");
    setResult(null);
    setWeather(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/disease-intel/risk?disease=${encodeURIComponent(diseaseName)}&confidence=${confidence}&location=${encodeURIComponent(city)}`
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail ?? `Server error: ${res.status}`);
      }
      const data = await res.json();
      setWeather(data.weather);
      setResult(data.result);
    } catch (err) {
      setError((err as Error).message ?? "Failed to fetch weather data. Check the city name.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <section className="container-px mx-auto max-w-6xl py-12 sm:py-16">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Disease intelligence</span>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Understand how weather shapes disease risk.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Enter a detected disease and your location. We'll analyse upcoming weather
            conditions and tell you how the disease is likely to progress — and exactly when to act.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          {/* Input panel */}
          <form
            id="disease-intel-form"
            onSubmit={handleSubmit}
            className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8"
          >
            {/* Disease Name */}
            <DField icon={Brain} label="Disease Name *">
              <input
                id="disease-name-input"
                required
                value={diseaseName}
                onChange={(e) => setDiseaseName(e.target.value)}
                placeholder="e.g. Early Blight, Powdery Mildew"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Use the name from your TerraLeaf diagnosis or enter any disease name.
              </p>
            </DField>

            {/* Confidence */}
            <DField icon={TrendingUp} label="Detection Confidence (%)">
              <input
                id="confidence-input"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={confidence || ""}
                onChange={(e) => setConfidence(Number(e.target.value))}
                placeholder="e.g. 92.7"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </DField>

            {/* Location */}
            <DField icon={MapPin} label="City / Location *">
              <input
                id="intel-city-input"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru, Chennai, Mumbai"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </DField>

            {/* Info note */}
            <div className="mb-5 rounded-2xl border border-primary/20 bg-primary-soft/40 p-4">
              <div className="flex items-start gap-2">
                <Brain className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <p className="text-xs leading-relaxed text-foreground/70">
                  This module does <strong>not</strong> re-run disease detection. It uses your
                  existing diagnosis and combines it with live weather data to predict disease
                  progression and recommend the best time to treat.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              id="analyse-intel-btn"
              type="submit"
              disabled={loading || !diseaseKB}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Analysing conditions…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Analyse Disease Risk
                </>
              )}
            </button>
          </form>

          {/* Results panel */}
          <div>
            {loading ? (
              <IntelSkeleton />
            ) : result && weather ? (
              <IntelResults result={result} weather={weather} />
            ) : (
              <IntelEmpty />
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

// ── Field helper ─────────────────────────────────────────────────────────────

function DField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </label>
      {children}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function IntelEmpty() {
  return (
    <div className="flex h-full flex-col justify-center rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Brain className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold">Intelligence report will appear here</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter a disease name and your city to see how weather affects disease risk over the next 5 days.
      </p>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function IntelSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-28 rounded-3xl bg-muted" />
      <div className="h-24 rounded-3xl bg-muted" />
      <div className="h-44 rounded-3xl bg-muted" />
      <div className="h-40 rounded-3xl bg-muted" />
    </div>
  );
}

// ── Results ───────────────────────────────────────────────────────────────────

function IntelResults({ result, weather }: { result: DiseaseIntelResult; weather: WeatherData }) {
  const riskScoreCircumference = 2 * Math.PI * 32;
  const riskDashOffset = riskScoreCircumference * (1 - result.spreadRiskScore / 100);

  const riskStroke =
    result.currentSpreadRisk === "High"
      ? "stroke-destructive"
      : result.currentSpreadRisk === "Moderate"
        ? "stroke-amber"
        : "stroke-primary";

  return (
    <div className="space-y-4 reveal-up">
      {/* Disease Summary */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-primary-soft to-card p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Disease Summary</span>
            <h3 className="mt-1 font-display text-xl font-bold leading-tight">{result.diseaseDisplayName}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{result.pathogen}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {weather.location.displayName}, {weather.location.country}
            </p>
            {!result.isKnownDisease && (
              <span className="mt-2 inline-block rounded-full bg-amber/20 px-2.5 py-0.5 text-xs font-semibold text-amber-foreground">
                Not in knowledge base — generic assessment
              </span>
            )}
          </div>
          <div className="flex flex-col items-center shrink-0">
            {/* Confidence bar */}
            {result.confidence > 0 && (
              <div className="w-24">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Confidence</span>
                  <span className="font-semibold">{result.confidence.toFixed(1)}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spread Risk */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
              <circle
                cx="40" cy="40" r="32" fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={riskScoreCircumference}
                strokeDashoffset={riskDashOffset}
                className={`${riskStroke} transition-all duration-700`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-sm font-bold">{result.spreadRiskScore}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm text-muted-foreground">Disease Spread Risk</span>
            </div>
            <SpreadRiskBadge risk={result.currentSpreadRisk} large />
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground italic">
              {result.spreadRiskExplanation}
            </p>
          </div>
        </div>
      </div>

      {/* 5-Day Disease Forecast */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h4 className="font-display text-base font-semibold">5-Day Disease Forecast</h4>
        </div>
        <div className="space-y-2">
          {result.dayForecast.map((day) => (
            <div key={day.date} className="flex items-center gap-3 rounded-2xl bg-muted/30 px-4 py-2.5">
              <span className="w-10 text-xs font-semibold text-muted-foreground">{day.dayLabel}</span>
              <div className="flex flex-1 items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${day.risk === "High" ? "bg-destructive" : day.risk === "Moderate" ? "bg-amber" : "bg-primary"
                      }`}
                    style={{ width: `${day.riskScore}%` }}
                  />
                </div>
                <SpreadRiskBadge risk={day.risk} />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Thermometer className="h-3 w-3" />
                <span>{day.tempMax}°</span>
                <Droplets className="h-3 w-3" />
                <span>{day.humidity}%</span>
                <CloudRain className="h-3 w-3" />
                <span>{day.precipitationProb}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Treatment Timing */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-primary" />
          <h4 className="font-display text-base font-semibold">Treatment Timing Recommendations</h4>
        </div>
        <div className="space-y-3">
          {result.treatmentTiming.map((t, i) => (
            <div
              key={i}
              className={`rounded-2xl p-4 ${t.priority === "urgent" ? "bg-amber/10 border border-amber/20" : "bg-muted/30"}`}
            >
              <div className="flex items-start gap-2">
                {t.priority === "urgent" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-foreground shrink-0" />
                ) : (
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                )}
                <div>
                  <p className="font-display text-sm font-semibold">{t.title}</p>
                  <p className="mt-1 text-sm text-foreground/85">{t.action}</p>
                  <p className="mt-1.5 text-xs italic text-muted-foreground">Why: {t.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monitoring */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-4 w-4 text-primary" />
          <h4 className="font-display text-base font-semibold">Monitoring Recommendations</h4>
        </div>
        <ul className="space-y-3">
          {result.monitoring.map((m, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div>
                <p className="text-sm font-medium text-foreground/90">{m.action}</p>
                <p className="mt-0.5 text-xs text-muted-foreground italic">Why: {m.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Spread risk badge ─────────────────────────────────────────────────────────

function SpreadRiskBadge({ risk, large = false }: { risk: SpreadRisk; large?: boolean }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 font-semibold ${riskBgColor(risk)} ${large ? "text-sm" : "text-[11px]"}`}>
      {risk} Risk
    </span>
  );
}
