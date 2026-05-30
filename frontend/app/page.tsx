import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Check,
  Code2,
  Github,
  MessageSquare,
  Palette,
  Play,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Zap,
} from "lucide-react";

import { WidgetEmbed } from "@/components/widget-embed";

const DEMO_WIDGET_KEY = process.env.NEXT_PUBLIC_DEMO_WIDGET_KEY ?? "";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-100 antialiased">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Demo />
      <CtaBand />
      <Footer />
      <WidgetEmbed widgetKey={DEMO_WIDGET_KEY} apiUrl={API_URL} />
    </main>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
        <Bot className="h-5 w-5 text-white" strokeWidth={2.2} />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        SmartDesk <span className="text-gradient">AI</span>
      </span>
    </Link>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#how" className="transition hover:text-white">How it works</a>
          <a href="#pricing" className="transition hover:text-white">Pricing</a>
        </nav>
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
        >
          Dashboard
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-48 h-[620px] w-[920px] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-[140px]"
      />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-28 text-center">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-slate-300 backdrop-blur">
          <Sparkles className="h-4 w-4 text-violet-300" />
          RAG-powered · Multi-tenant · Self-hostable
        </div>
        <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
          Turn your docs into a{" "}
          <span className="text-gradient">24/7 AI support agent</span>
        </h1>
        <p className="mt-7 max-w-2xl text-pretty text-lg text-slate-400 md:text-xl">
          Upload your knowledge base, embed one line of code, and let SmartDesk AI
          resolve 80% of customer questions — accurately, instantly, with citations.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50"
          >
            Start free
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#demo"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-semibold text-slate-100 backdrop-blur transition hover:bg-white/10"
          >
            <Play className="h-4 w-4 fill-current" />
            See live demo
          </a>
        </div>
        <div className="mt-16 grid w-full max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-8">
          <Stat n="80%" label="Auto-resolved" />
          <Stat n="<2s" label="Response time" />
          <Stat n="∞" label="Conversations" />
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold text-gradient md:text-4xl">{n}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}

function SectionHeading({ tag, title, sub }: { tag: string; title: string; sub: string }) {
  return (
    <div className="mx-auto mb-16 max-w-2xl text-center">
      <span className="text-sm font-semibold uppercase tracking-widest text-indigo-400">{tag}</span>
      <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight md:text-5xl">{title}</h2>
      <p className="mt-4 text-pretty text-lg text-slate-400">{sub}</p>
    </div>
  );
}

const FEATURES = [
  { icon: Upload, title: "Upload anything", body: "PDF, DOCX, Markdown, or a full website crawl. We chunk, embed, and index it for you automatically." },
  { icon: MessageSquare, title: "Embeddable widget", body: "One <script> tag gives your site a 24/7 AI agent. Customize colors, position, and persona." },
  { icon: Brain, title: "RAG with citations", body: "Every answer cites its source chunk, so your users — and you — can verify it instantly." },
  { icon: Users, title: "Human handoff", body: "Low-confidence chats are flagged automatically. Agents jump in live from the dashboard." },
  { icon: BarChart3, title: "Analytics dashboard", body: "Top questions, satisfaction rate, and exactly where the AI struggles — all in one view." },
  { icon: ShieldCheck, title: "Multi-tenant & secure", body: "Row-level org isolation, CSP, HSTS, rate-limiting, and PII redaction baked in by default." },
];

function Features() {
  return (
    <section id="features" className="py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          tag="Features"
          title="Everything you need to ship support AI"
          sub="From raw documents to an embedded widget — in under 10 minutes."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-indigo-400/40 hover:bg-white/[0.06]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-inset ring-white/10 transition group-hover:from-indigo-500/30 group-hover:to-violet-500/30">
                <Icon className="h-6 w-6 text-indigo-300" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Upload, n: "01", title: "Upload your knowledge", body: "Drag in PDFs, paste URLs, or connect Notion / Confluence. We parse and embed in seconds." },
  { icon: Palette, n: "02", title: "Customize your widget", body: "Brand colors, welcome message, and persona. Preview it live before you publish." },
  { icon: Code2, n: "03", title: "Embed one line of code", body: "Copy the <script> snippet, drop it on your site, and you're live. That's it." },
];

function HowItWorks() {
  return (
    <section id="how" className="border-y border-white/10 bg-white/[0.02] py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          tag="How it works"
          title="Live in three steps"
          sub="No ML expertise required. If you can copy-paste, you can ship it."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, n, title, body }) => (
            <div key={n} className="relative rounded-2xl border border-white/10 bg-slate-950 p-7">
              <span className="absolute right-6 top-6 text-5xl font-bold text-white/5">{n}</span>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
                <Icon className="h-5 w-5 text-white" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["100 conversations / mo", "1 knowledge base", "Community support"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    features: ["5,000 conversations / mo", "Unlimited knowledge bases", "Email support", "Custom branding"],
    cta: "Start trial",
    highlight: true,
  },
  {
    name: "Business",
    price: "$99",
    period: "per month",
    features: ["50,000 conversations / mo", "Multi-user team", "Priority support", "SSO + audit logs"],
    cta: "Contact sales",
    highlight: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          tag="Pricing"
          title="Simple, honest pricing"
          sub="No per-seat tax. No hidden token fees. Cancel anytime."
        />
        <div className="grid items-start gap-6 md:grid-cols-3">
          {TIERS.map((t) =>
            t.highlight ? (
              <div
                key={t.name}
                className="rounded-2xl bg-gradient-to-b from-indigo-500 to-violet-500 p-[1.5px] shadow-2xl shadow-indigo-500/25"
              >
                <div className="h-full rounded-2xl bg-slate-950 p-8">
                  <PriceBody tier={t} />
                </div>
              </div>
            ) : (
              <div
                key={t.name}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-8"
              >
                <PriceBody tier={t} />
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

function PriceBody({ tier }: { tier: (typeof TIERS)[number] }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">{tier.name}</span>
        {tier.highlight && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1 text-xs font-semibold text-white">
            <Zap className="h-3 w-3" />
            Popular
          </span>
        )}
      </div>
      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="text-5xl font-bold tracking-tight">{tier.price}</span>
        <span className="text-sm text-slate-400">/ {tier.period}</span>
      </div>
      <ul className="mt-7 space-y-3 text-sm">
        {tier.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-slate-300">
            <Check className="h-4 w-4 flex-none text-indigo-400" strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/sign-up"
        className={`mt-8 block rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
          tier.highlight
            ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
            : "border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
        }`}
      >
        {tier.cta}
      </Link>
    </>
  );
}

function Demo() {
  const live = Boolean(process.env.NEXT_PUBLIC_DEMO_WIDGET_KEY);
  return (
    <section id="demo" className="border-y border-white/10 bg-white/[0.02] py-28">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <span className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Live demo</span>
        <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight md:text-5xl">
          {live ? "The widget is live on this page" : "Try the widget right here"}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-slate-400">
          {live
            ? "Look bottom-right — that chat bubble is the real SmartDesk widget, talking to the same RAG backend that powers production. Click it and ask anything."
            : "Once a demo widget key is configured, a real chat bubble appears here, powered by the same backend customers use in production."}
        </p>
        <div className="mx-auto mt-10 max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-left shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-red-400/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
            <span className="h-3 w-3 rounded-full bg-green-400/80" />
            <span className="ml-2 text-xs text-slate-500">index.html</span>
          </div>
          <pre className="overflow-x-auto p-5 text-sm leading-relaxed">
            <code>
              <span className="text-slate-500">{"<script"}</span>
              {"\n  "}
              <span className="text-violet-300">src</span>
              <span className="text-slate-500">=</span>
              <span className="text-emerald-300">{'"https://cdn.smartdesk.ai/smartdesk.js"'}</span>
              {"\n  "}
              <span className="text-violet-300">data-widget-key</span>
              <span className="text-slate-500">=</span>
              <span className="text-emerald-300">{'"wk_xxx"'}</span>
              {"\n  "}
              <span className="text-violet-300">defer</span>
              {"\n"}
              <span className="text-slate-500">{"></script>"}</span>
            </code>
          </pre>
        </div>
        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-slate-500">
          <span>One script tag</span>·<span>5.5 KB</span>·
          <span>Real-time streaming</span>·<span>Cites its sources</span>
        </p>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="py-28">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 px-6 py-20 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-slate-950 to-violet-600/30"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-[120px]"
        />
        <div className="relative">
          <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Ship your AI support agent today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-slate-300">
            Free to start. No credit card. Be answering customer questions in ten minutes.
          </p>
          <Link
            href="/sign-up"
            className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-slate-900 shadow-xl transition hover:bg-slate-200"
          >
            Get started free
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-slate-400 sm:flex-row">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-indigo-400" />
          <span>© 2026 SmartDesk AI — built with Next.js, FastAPI &amp; Claude</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#pricing" className="transition hover:text-white">Pricing</a>
          <a
            href="https://github.com/PuriphatXXVII/SmartDesk-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition hover:text-white"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
