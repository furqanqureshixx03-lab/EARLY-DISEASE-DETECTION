import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ScanLine,
  Sparkles,
  Sprout,
  Sun,
  ShieldCheck,
  Leaf,
  Upload,
  Cpu,
  ClipboardCheck,
  ChevronDown,
  Brain,
  CloudSun,
} from "lucide-react";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import heroLeaf from "@/assets/hero-leaf.jpg";
import terraceGarden from "@/assets/terrace-garden.jpg";
import handsPlant from "@/assets/hands-plant.jpg";
import disease1 from "@/assets/disease-1.jpg";
import disease2 from "@/assets/disease-2.jpg";
import disease3 from "@/assets/disease-3.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TerraLeaf — Healthy Plants Start With Early Detection" },
      {
        name: "description",
        content:
          "Upload a leaf image, identify plant diseases instantly, and receive smart guidance for healthier terrace gardens.",
      },
      { property: "og:title", content: "TerraLeaf — Healthy Plants Start With Early Detection" },
      { property: "og:description", content: "AI-assisted leaf diagnosis and practical terrace farming guidance." },
    ],
  }),
  component: HomePage,
});

const trustItems = [
  { icon: Sparkles, label: "AI-Powered Analysis" },
  { icon: ScanLine, label: "Fast Results" },
  { icon: Sprout, label: "Terrace Garden Friendly" },
];

function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <ModuleDashboard />
      <FeatureSplit />
      <LibraryPreview />
      <About />
      <Faq />
      <CtaBanner />
    </SiteLayout>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.94_0.06_148_/_0.7),transparent_70%)]"
      />
      <div className="container-px mx-auto grid max-w-7xl gap-12 pb-20 pt-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:pt-20">
        <div className="reveal-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <span className="relative grid h-2 w-2 place-items-center">
              <span className="absolute inset-0 rounded-full bg-secondary pulse-ring" />
              <span className="h-2 w-2 rounded-full bg-primary" />
            </span>
            Now in public beta · PlantVillage trained
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Healthy plants start with{" "}
            <span className="relative whitespace-nowrap text-primary">
              early detection
              <svg
                aria-hidden
                viewBox="0 0 200 8"
                className="absolute -bottom-1 left-0 h-2 w-full text-secondary"
                preserveAspectRatio="none"
              >
                <path d="M2 6 C 50 1, 150 1, 198 6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>
            .
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Upload a leaf image, identify plant diseases instantly, and receive
            smart guidance for healthier terrace gardens — built for home growers
            who care about every harvest.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/detect"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-elevated transition-all hover:-translate-y-0.5 hover:shadow-glow"
            >
              Detect Disease
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/terrace"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent"
            >
              Explore Terrace Farming
            </Link>
          </div>
        </div>

        <div className="relative reveal-up">
          <div className="relative aspect-[5/6] overflow-hidden rounded-3xl border border-border bg-card shadow-elevated">
            <img
              src={heroLeaf}
              alt="Macro photograph of fresh green leaves with dew"
              className="h-full w-full object-cover"
              width={1600}
              height={1200}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent" />
          </div>

          {/* Floating result card */}
          <div className="absolute -bottom-6 -left-4 w-[260px] rounded-2xl border border-border bg-card/95 p-4 shadow-elevated backdrop-blur-md sm:-left-8 sm:w-[300px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Diagnosis</span>
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">Healthy</span>
            </div>
            <div className="mt-2 font-display text-lg font-semibold">Tea Camellia</div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[96%] rounded-full bg-gradient-to-r from-primary to-secondary" />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Confidence</span>
              <span className="font-semibold text-foreground">96.4%</span>
            </div>
          </div>

          <div className="absolute -right-2 top-6 hidden w-[200px] rounded-2xl border border-border bg-card/95 p-3 shadow-elevated backdrop-blur-md sm:right-0 sm:block">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Sun className="h-4 w-4 text-amber" /> Today's care
            </div>
            <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
              Water at dawn · 200ml
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="border-y border-border bg-card/40">
      <div className="container-px mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 py-5 text-sm text-muted-foreground">
        {trustItems.map(({ icon: Icon, label }) => (
          <div key={label} className="inline-flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <span className="font-medium">{label}</span>
          </div>
        ))}
        <div className="hidden h-4 w-px bg-border md:block" />
        <div className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="font-medium">Privacy-first</span>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: "Upload a leaf image",
      desc: "Drag and drop a photo from your phone or camera — clear, well-lit shots work best.",
    },
    {
      icon: Cpu,
      title: "TerraLeaf AI analyzes the symptoms",
      desc: "Our model compares visual patterns against the PlantVillage dataset in seconds.",
    },
    {
      icon: ClipboardCheck,
      title: "Receive diagnosis and care",
      desc: "Get a clear verdict with treatment, prevention tips and seasonal next steps.",
    },
  ];

  return (
    <section className="container-px mx-auto max-w-7xl py-24">
      <SectionHeader
        eyebrow="How it works"
        title="From a single photo to a confident plan"
        description="Three simple steps designed to feel like talking with a calm, knowledgeable gardener."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="group relative rounded-3xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </span>
              <span className="font-display text-5xl font-bold text-muted/60">0{i + 1}</span>
            </div>
            <h3 className="mt-6 font-display text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 3-Module Dashboard ─────────────────────────────────────────────────────

const modules = [
  {
    icon: ScanLine,
    to: "/detect" as const,
    label: "Disease Detection",
    eyebrow: "Module 01",
    description:
      "Upload a leaf image and receive an instant AI-powered diagnosis with treatment and prevention recommendations.",
    cta: "Detect a disease",
    accentClass: "bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  },
  {
    icon: CloudSun,
    to: "/terrace" as const,
    label: "Terrace Assistant",
    eyebrow: "Module 02",
    description:
      "Get live, weather-based care recommendations for your terrace plants — watering, heat, rain, and UV alerts.",
    cta: "Open assistant",
    accentClass: "bg-secondary/20 text-secondary-foreground group-hover:bg-secondary group-hover:text-secondary-foreground",
  },
  {
    icon: Brain,
    to: "/disease-intel" as const,
    label: "Disease Intelligence",
    eyebrow: "Module 03",
    description:
      "Enhance your diagnosis with weather-aware spread risk analysis, treatment timing, and 5-day disease forecasts.",
    cta: "Analyse risk",
    accentClass: "bg-amber/15 text-amber-foreground group-hover:bg-amber group-hover:text-background",
  },
];

function ModuleDashboard() {
  return (
    <section className="bg-card/40 py-24">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Three modules. One ecosystem."
          title="Everything your terrace garden needs."
          description="TerraLeaf combines AI disease detection, live weather intelligence, and disease risk forecasting into a single, cohesive platform."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {modules.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className="group relative flex flex-col rounded-3xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="flex items-center justify-between">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl transition-colors ${m.accentClass}`}>
                  <m.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{m.eyebrow}</span>
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold">{m.label}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{m.description}</p>
              <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-2.5">
                {m.cta} <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureSplit() {
  return (
    <section className="container-px mx-auto max-w-7xl py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative order-2 lg:order-1">
          <div className="aspect-[5/4] overflow-hidden rounded-3xl border border-border shadow-elevated">
            <img src={terraceGarden} alt="Modern rooftop terrace garden at golden hour" className="h-full w-full object-cover" loading="lazy" width={1400} height={1000} />
          </div>
          <div className="absolute -bottom-6 -right-4 hidden w-[260px] overflow-hidden rounded-2xl border border-border shadow-elevated sm:block">
            <img src={handsPlant} alt="Hands holding a basil plant" className="aspect-square w-full object-cover" loading="lazy" width={400} height={400} />
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Terrace assistant</span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            A thoughtful companion for the garden above your city.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Tell us about your city, terrace size, and sunlight — TerraLeaf
            curates crops that thrive, watering rhythms that fit your week, and
            seasonal advice you can actually follow.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              "Crop recommendations matched to your climate",
              "Personalized watering and fertilizer schedules",
              "Season-by-season planting guidance",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <span className="mt-1 grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary">
                  <Leaf className="h-3 w-3" />
                </span>
                <span className="text-foreground/90">{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link
              to="/terrace"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all hover:-translate-y-0.5"
            >
              Open Terrace Assistant <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function LibraryPreview() {
  const items = [
    { img: disease1, name: "Early Blight", plant: "Tomato", desc: "Concentric brown spots on older leaves, common in humid weather." },
    { img: disease2, name: "Powdery Mildew", plant: "Grape", desc: "White, dusty patches that spread on leaf surfaces in poor airflow." },
    { img: disease3, name: "Leaf Rust", plant: "Apple", desc: "Orange pustules on the underside of leaves; treat early to limit spread." },
  ];
  return (
    <section className="bg-primary-soft/40 py-24">
      <div className="container-px mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader
            eyebrow="Disease library"
            title="Learn the patterns. Spot trouble early."
            description="Browse curated entries with authentic photography and clear, practical guidance."
            align="left"
          />
          <Link to="/library" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all">
            View full library <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((d) => (
            <article key={d.name} className="group overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={d.img} alt={`${d.name} on ${d.plant} leaf`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" width={800} height={600} />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-amber/15 px-2.5 py-1 font-semibold text-amber-foreground">{d.plant}</span>
                  <span className="text-muted-foreground">Common</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">{d.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.desc}</p>
                <Link to="/library" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  const milestones = [
    { year: "2023", title: "Idea", desc: "Born from a balcony tomato that wouldn't stop wilting." },
    { year: "2024", title: "Model", desc: "Trained on the PlantVillage dataset across 38 crop-disease classes." },
    { year: "2025", title: "Beta", desc: "Opened to home gardeners across cities with terrace-first guidance." },
    { year: "Next", title: "Roadmap", desc: "Offline mobile, multilingual care plans, community knowledge base." },
  ];
  return (
    <section className="container-px mx-auto max-w-7xl py-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">About TerraLeaf</span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Built to make plant care feel less like guesswork.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            We're a small team of gardeners and machine-learning engineers
            building tools that empower home growers. Our goal is simple: make
            confident plant care accessible to anyone with a windowsill, balcony,
            or terrace.
          </p>
        </div>
        <ol className="relative space-y-6 border-l border-border pl-6">
          {milestones.map((m) => (
            <li key={m.year} className="relative">
              <span className="absolute -left-[31px] top-1.5 grid h-4 w-4 place-items-center rounded-full border-2 border-background bg-primary" />
              <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm font-bold text-primary">{m.year}</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span className="text-sm font-semibold">{m.title}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const faqs = [
  { q: "How accurate are the predictions?", a: "Our model averages ~94% top-1 accuracy on the PlantVillage benchmark. Real-world accuracy depends on lighting and image quality — we always show a confidence score." },
  { q: "Which plants are supported?", a: "TerraLeaf supports 14 crop species including tomato, potato, grape, apple, corn, pepper, and more — covering 38 healthy and diseased classes." },
  { q: "Can beginners use TerraLeaf?", a: "Absolutely. Every diagnosis comes with plain-language treatment and prevention steps you can act on the same day." },
  { q: "Is this suitable for terrace gardens?", a: "Yes — the Terrace Assistant is tuned for container growing, sunlight constraints, and small-space rotations." },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-card/40 py-24">
      <div className="container-px mx-auto max-w-3xl">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions, gently answered"
          description="Everything you might wonder before your first scan."
        />
        <div className="mt-12 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-accent/40"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-base font-semibold sm:text-lg">{f.q}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`} />
                </button>
                <div
                  className="grid overflow-hidden px-6 transition-all duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="container-px mx-auto max-w-7xl py-20">
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-primary to-[oklch(0.38_0.12_148)] p-10 text-primary-foreground shadow-elevated sm:p-16">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-amber/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Ready to give your plants a complete check-up?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-primary-foreground/85">
            Detect diseases, get weather-smart terrace care, and understand disease spread risk — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/detect" className="inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5">
              Detect Disease <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/terrace" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10">
              Terrace Assistant
            </Link>
            <Link to="/disease-intel" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10">
              Disease Intelligence
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</span>
      <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}
