/**
 * detect.tsx — Module 1: Disease Detection
 *
 * Preserves all existing UI (upload zone, image preview, progress animation,
 * DetailCard components, EmptyResults). The only change is replacing the fake
 * local timer in analyze() with a real fetch() call to the backend /predict
 * endpoint, and rendering the real response in ResultsPanel.
 *
 * Backend URL is configurable via VITE_API_BASE_URL env variable (defaults to
 * http://localhost:8000 for local development).
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Droplets,
  Leaf,
  ArrowRight,
  X,
  Brain,
  WifiOff,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";

// Backend base URL — set VITE_API_BASE_URL in .env.local for production
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

export const Route = createFileRoute("/detect")({
  head: () => ({
    meta: [
      { title: "Detect Plant Disease — TerraLeaf" },
      { name: "description", content: "Upload a leaf image and receive an instant AI diagnosis with treatment and prevention tips." },
      { property: "og:title", content: "Detect Plant Disease — TerraLeaf" },
      { property: "og:description", content: "Instant AI-powered leaf diagnosis with care recommendations." },
    ],
  }),
  component: DetectPage,
});

// ── Types ───────────────────────────────────────────────────────────────────

type Status = "idle" | "ready" | "analyzing" | "done" | "error";

/** Matches the PredictResponse schema from the backend */
interface PredictResponse {
  success: boolean;
  prediction: {
    disease: string;
    confidence: number;
    top_predictions: Array<{ name: string; confidence: number }>;
  };
  recommendation: {
    severity: string;
    symptoms: string[];
    treatment: string[];
    prevention: string[];
  };
}

// ── Page ────────────────────────────────────────────────────────────────────

function DetectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [drag, setDrag] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus("ready");
    setProgress(0);
    setResult(null);
    setErrorMessage("");
  }

  async function analyze() {
    if (!file) return;
    setStatus("analyzing");
    setProgress(0);
    setResult(null);
    setErrorMessage("");

    // Animate progress bar while the request is in-flight
    const start = Date.now();
    const animationId = { current: 0 };
    const tick = () => {
      const elapsed = Date.now() - start;
      // Progress animates up to 85% — the last 15% fills when the response arrives
      const p = Math.min(85, (elapsed / 2500) * 85);
      setProgress(p);
      if (p < 85) animationId.current = requestAnimationFrame(tick);
    };
    animationId.current = requestAnimationFrame(tick);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        body: formData,
      });

      // Complete the progress bar
      cancelAnimationFrame(animationId.current);
      setProgress(100);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail ?? `Server error: ${res.status}`);
      }

      const data: PredictResponse = await res.json();

      // Small delay so the user sees 100% before results render
      await new Promise((r) => setTimeout(r, 350));
      setResult(data);
      setStatus("done");
    } catch (err) {
      cancelAnimationFrame(animationId.current);
      setProgress(0);
      setStatus("error");
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setErrorMessage(
          "Cannot reach the TerraLeaf backend. Make sure the Python server is running on port 8000."
        );
      } else {
        setErrorMessage((err as Error).message ?? "An unexpected error occurred.");
      }
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setErrorMessage("");
  }

  return (
    <SiteLayout>
      <section className="container-px mx-auto max-w-6xl py-12 sm:py-16">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Disease detection</span>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Upload a leaf. Get a clear diagnosis.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            A single, well-lit photo is all TerraLeaf needs. We'll surface
            symptoms, treatment, and prevention in seconds.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          {/* Uploader */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
            {!preview ? (
              <label
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
                className={`flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${
                  drag
                    ? "border-primary bg-primary-soft/60"
                    : "border-border bg-muted/40 hover:border-primary/40 hover:bg-primary-soft/30"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-card text-primary shadow-soft">
                  <Upload className="h-7 w-7" />
                </span>
                <p className="mt-5 font-display text-lg font-semibold">Drop a leaf image here</p>
                <p className="mt-1 text-sm text-muted-foreground">or click to browse · JPG / PNG up to 10MB</p>
                <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft">
                  <ImageIcon className="h-4 w-4" /> Choose image
                </span>
              </label>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-border">
                <img src={preview} alt="Uploaded leaf preview" className="aspect-[4/3] w-full object-cover" />
                <button
                  onClick={reset}
                  aria-label="Remove image"
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-soft backdrop-blur transition-transform hover:scale-105"
                >
                  <X className="h-4 w-4" />
                </button>
                {status === "analyzing" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
                    <div className="relative grid h-16 w-16 place-items-center">
                      <span className="absolute inset-0 rounded-full bg-primary/20 pulse-ring" />
                      <Sparkles className="h-7 w-7 text-primary" />
                    </div>
                    <p className="mt-4 font-display text-base font-semibold">Analyzing leaf…</p>
                    <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                id="analyze-btn"
                disabled={status !== "ready"}
                onClick={analyze}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:hover:translate-y-0"
              >
                <Sparkles className="h-4 w-4" /> Analyze leaf
              </button>
              {file && (
                <button onClick={reset} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Upload another
                </button>
              )}
              <p className="ml-auto text-xs text-muted-foreground">
                Tip: shoot in daylight, fill the frame with the leaf.
              </p>
            </div>
          </div>

          {/* Results */}
          <div>
            {status === "error" ? (
              <ErrorPanel message={errorMessage} onRetry={analyze} />
            ) : status !== "done" || !result ? (
              <EmptyResults />
            ) : (
              <ResultsPanel result={result} onDiseaseIntel={() => {}} />
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Results are AI-generated and may vary under real field conditions. Always verify with a local agronomist for critical crop decisions.
        </p>
      </section>
    </SiteLayout>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyResults() {
  return (
    <div className="flex h-full flex-col justify-center rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Leaf className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold">Your diagnosis will appear here</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload an image to see the predicted disease, severity, and care recommendations.
      </p>
    </div>
  );
}

// ── Error state ──────────────────────────────────────────────────────────────

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col justify-center rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <WifiOff className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-destructive">Analysis failed</h3>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <button
        onClick={onRetry}
        className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}

// ── Results Panel — renders real backend response ────────────────────────────

function ResultsPanel({ result, onDiseaseIntel }: { result: PredictResponse; onDiseaseIntel: () => void }) {
  const { prediction, recommendation } = result;
  const confidence = prediction.confidence;

  // Format disease name: "Tomato___Early_blight" → "Tomato — Early Blight"
  const formattedName = prediction.disease
    .replace(/___/g, " — ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const severityColor =
    recommendation.severity?.toLowerCase() === "severe"
      ? "bg-destructive/15 text-destructive"
      : recommendation.severity?.toLowerCase() === "moderate"
      ? "bg-amber/15 text-amber-foreground"
      : "bg-primary-soft text-primary";

  return (
    <div className="space-y-4 reveal-up">
      {/* Diagnosis header */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Diagnosis</span>
            <h3 className="mt-2 font-display text-2xl font-bold">{formattedName}</h3>
            {prediction.top_predictions[1] && (
              <p className="mt-1 text-sm text-muted-foreground">
                Next: {prediction.top_predictions[1].name.replace(/_/g, " ")} ({prediction.top_predictions[1].confidence.toFixed(1)}%)
              </p>
            )}
          </div>
          {recommendation.severity && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityColor}`}>
              {recommendation.severity} severity
            </span>
          )}
        </div>

        {/* Confidence bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Confidence</span>
            <span className="font-semibold text-foreground">{confidence.toFixed(1)}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Symptoms */}
      {recommendation.symptoms?.length > 0 && (
        <DetailCard
          icon={AlertTriangle}
          tone="amber"
          title="Observed symptoms"
          items={recommendation.symptoms}
        />
      )}

      {/* Treatment */}
      {recommendation.treatment?.length > 0 && (
        <DetailCard
          icon={Droplets}
          tone="primary"
          title="Recommended treatment"
          items={recommendation.treatment}
        />
      )}

      {/* Prevention */}
      {recommendation.prevention?.length > 0 && (
        <DetailCard
          icon={ShieldCheck}
          tone="primary"
          title="Prevention tips"
          items={recommendation.prevention}
        />
      )}

      {/* Cross-module CTA → Disease Intelligence */}
      <div className="rounded-3xl border border-border bg-primary-soft/50 p-6">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h4 className="font-display text-sm font-semibold text-primary">Go deeper with Disease Intelligence</h4>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground/80">
          See how upcoming weather conditions will affect this disease and get treatment timing recommendations.
        </p>
        <Link
          to="/disease-intel"
          search={{ disease: prediction.disease, confidence: confidence }}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all"
        >
          Open Disease Intelligence <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

// ── Detail card — unchanged from original ────────────────────────────────────

function DetailCard({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: typeof Leaf;
  title: string;
  items: string[];
  tone: "primary" | "amber";
}) {
  const toneClass = tone === "amber" ? "bg-amber/15 text-amber-foreground" : "bg-primary-soft text-primary";
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h4 className="font-display text-base font-semibold">{title}</h4>
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/85">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
