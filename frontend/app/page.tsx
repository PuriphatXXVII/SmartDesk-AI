"use client";

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

import { LangToggle, ThemeToggle } from "@/components/toggles";
import { WidgetEmbed } from "@/components/widget-embed";
import { useI18n } from "@/lib/i18n";
import { WIDGET_SRC } from "@/lib/widget";

const DEMO_WIDGET_KEY = process.env.NEXT_PUBLIC_DEMO_WIDGET_KEY ?? "";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-bg text-fg antialiased">
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
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
        <Bot className="h-5 w-5 text-white" strokeWidth={2.2} />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        SmartDesk <span className="text-gradient">AI</span>
      </span>
    </Link>
  );
}

function Header() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted lg:flex">
          <a href="#features" className="transition hover:text-fg">{t.nav.features}</a>
          <a href="#how" className="transition hover:text-fg">{t.nav.how}</a>
          <a href="#pricing" className="transition hover:text-fg">{t.nav.pricing}</a>
        </nav>
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-1.5 rounded-lg bg-fg px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90"
          >
            {t.nav.dashboard}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-48 h-155 w-230 -translate-x-1/2 rounded-full bg-indigo-600/25 blur-[140px]"
      />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-28 text-center">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-sm text-muted backdrop-blur">
          <Sparkles className="h-4 w-4 text-brand-fg" />
          {t.hero.badge}
        </div>
        <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
          {t.hero.titleA}
          <span className="text-gradient">{t.hero.titleB}</span>
        </h1>
        <p className="mt-7 max-w-2xl text-pretty text-lg text-muted md:text-xl">{t.hero.subtitle}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50"
          >
            {t.hero.ctaPrimary}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#demo"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-7 py-3.5 font-semibold text-fg backdrop-blur transition hover:bg-surface-2"
          >
            <Play className="h-4 w-4 fill-current" />
            {t.hero.ctaSecondary}
          </a>
        </div>
        <div className="mt-16 grid w-full max-w-lg grid-cols-3 gap-6 border-t border-line pt-8">
          {t.hero.stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-gradient md:text-4xl">{s.n}</div>
              <div className="mt-1 text-sm text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ tag, title, sub }: { tag: string; title: string; sub: string }) {
  return (
    <div className="mx-auto mb-16 max-w-2xl text-center">
      <span className="text-sm font-semibold uppercase tracking-widest text-brand-fg">{tag}</span>
      <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight md:text-5xl">{title}</h2>
      <p className="mt-4 text-pretty text-lg text-muted">{sub}</p>
    </div>
  );
}

const FEATURE_ICONS = [Upload, MessageSquare, Brain, Users, BarChart3, ShieldCheck];

function Features() {
  const { t } = useI18n();
  return (
    <section id="features" className="py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading tag={t.features.tag} title={t.features.title} sub={t.features.sub} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((it, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <div
                key={it.title}
                className="group rounded-2xl border border-line bg-surface p-6 transition hover:border-indigo-400/40 hover:bg-surface-2"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-linear-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-inset ring-line">
                  <Icon className="h-6 w-6 text-brand-fg" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{it.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{it.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const STEP_ICONS = [Upload, Palette, Code2];

function HowItWorks() {
  const { t } = useI18n();
  return (
    <section id="how" className="border-y border-line bg-surface py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading tag={t.how.tag} title={t.how.title} sub={t.how.sub} />
        <div className="grid gap-5 md:grid-cols-3">
          {t.how.steps.map((s, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <div key={s.title} className="relative rounded-2xl border border-line bg-bg p-7">
                <span className="absolute right-6 top-6 text-5xl font-bold text-fg/5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
                  <Icon className="h-5 w-5 text-white" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const { t } = useI18n();
  return (
    <section id="pricing" className="py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading tag={t.pricing.tag} title={t.pricing.title} sub={t.pricing.sub} />
        <div className="grid items-start gap-6 md:grid-cols-3">
          {t.pricing.tiers.map((tier, i) => {
            const highlight = i === 1;
            return highlight ? (
              <div
                key={tier.name}
                className="rounded-2xl bg-linear-to-b from-indigo-500 to-violet-500 p-[1.5px] shadow-2xl shadow-indigo-500/25"
              >
                <div className="h-full rounded-2xl bg-bg p-8">
                  <PriceBody tier={tier} highlight popular={t.pricing.popular} />
                </div>
              </div>
            ) : (
              <div key={tier.name} className="rounded-2xl border border-line bg-surface p-8">
                <PriceBody tier={tier} highlight={false} popular={t.pricing.popular} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type Tier = { name: string; price: string; period: string; features: string[]; cta: string };

function PriceBody({ tier, highlight, popular }: { tier: Tier; highlight: boolean; popular: string }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">{tier.name}</span>
        {highlight && (
          <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-indigo-500 to-violet-500 px-3 py-1 text-xs font-semibold text-white">
            <Zap className="h-3 w-3" />
            {popular}
          </span>
        )}
      </div>
      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="text-5xl font-bold tracking-tight">{tier.price}</span>
        <span className="text-sm text-muted">/ {tier.period}</span>
      </div>
      <ul className="mt-7 space-y-3 text-sm">
        {tier.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-muted">
            <Check className="h-4 w-4 flex-none text-brand-fg" strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/sign-up"
        className={`mt-8 block rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
          highlight
            ? "bg-linear-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
            : "border border-line bg-surface text-fg hover:bg-surface-2"
        }`}
      >
        {tier.cta}
      </Link>
    </>
  );
}

function Demo() {
  const { t } = useI18n();
  const live = Boolean(process.env.NEXT_PUBLIC_DEMO_WIDGET_KEY);
  return (
    <section id="demo" className="border-y border-line bg-surface py-28">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <span className="text-sm font-semibold uppercase tracking-widest text-brand-fg">{t.demo.tag}</span>
        <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight md:text-5xl">
          {live ? t.demo.titleLive : t.demo.titleIdle}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-muted">
          {live ? t.demo.bodyLive : t.demo.bodyIdle}
        </p>
        <div className="mx-auto mt-10 max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-left shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/3 px-4 py-2.5">
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
              <span className="text-emerald-300">{`"${WIDGET_SRC}"`}</span>
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
        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-subtle">
          {t.demo.foot.map((f, i) => (
            <span key={f} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>·</span>}
              {f}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

function CtaBand() {
  const { t } = useI18n();
  return (
    <section className="py-28">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-indigo-500/30 bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-700 px-6 py-20 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-144 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[120px]"
        />
        <div className="relative">
          <h2 className="text-balance text-4xl font-bold tracking-tight text-white md:text-5xl">
            {t.cta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-indigo-100">{t.cta.sub}</p>
          <Link
            href="/sign-up"
            className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-indigo-700 shadow-xl transition hover:bg-indigo-50"
          >
            {t.cta.button}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted sm:flex-row">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-brand-fg" />
          <span>{t.footer.copy}</span>
        </div>
        <a
          href="https://github.com/PuriphatXXVII/SmartDesk-AI"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 transition hover:text-fg"
        >
          <Github className="h-4 w-4" />
          GitHub
        </a>
      </div>
    </footer>
  );
}
