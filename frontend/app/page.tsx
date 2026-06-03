"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Check,
  FileText,
  Github,
  Infinity as InfinityIcon,
  MessageSquare,
  Play,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";

import { LangToggle, ThemeToggle } from "@/components/toggles";
import { WidgetEmbed } from "@/components/widget-embed";
import { useI18n } from "@/lib/i18n";
import { WIDGET_SRC } from "@/lib/widget";

const DEMO_WIDGET_KEY = process.env.NEXT_PUBLIC_DEMO_WIDGET_KEY ?? "";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-bg text-fg">
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
      <span className="grid h-7 w-7 place-items-center rounded-[6px] bg-accent text-white">
        <Bot className="h-4 w-4" strokeWidth={2.2} />
      </span>
      <span className="font-display text-lg font-medium tracking-tight">
        SmartDesk <span className="text-accent-fg">AI</span>
      </span>
    </Link>
  );
}

function Header() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto grid h-18 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5">
        <div className="justify-self-start">
          <Logo />
        </div>
        <nav className="hidden items-center gap-9 justify-self-center text-sm text-muted md:flex">
          <a href="#features" className="transition hover:text-fg">{t.nav.features}</a>
          <a href="#how" className="transition hover:text-fg">{t.nav.how}</a>
          <a href="#pricing" className="transition hover:text-fg">{t.nav.pricing}</a>
        </nav>
        <div className="flex items-center justify-self-end gap-2">
          <LangToggle />
          <ThemeToggle />
          <Link href="/dashboard" className="btn btn-ink group min-w-40">
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, #000 12%, #000 82%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 12%, #000 82%, transparent)",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-24">
        <div className="lg:col-span-7">
          <p className="eyebrow inline-flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {t.hero.badge}
          </p>
          <h1 className="mt-6 text-balance font-display text-[2.35rem] font-semibold leading-[1.07] tracking-tight sm:text-[2.9rem] xl:text-[3.5rem]">
            <span className="block">{t.hero.titleA}</span>
            <span className="block text-accent-fg">{t.hero.titleB}</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted">{t.hero.subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/sign-up" className="btn btn-accent group min-w-44">
              {t.hero.ctaPrimary}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a href="#demo" className="btn btn-ink min-w-44">
              <Play className="h-3.5 w-3.5 fill-current" />
              {t.hero.ctaSecondary}
            </a>
          </div>
          <dl className="mt-12 flex flex-wrap gap-x-12 gap-y-6 border-t border-line pt-8">
            {t.hero.stats.map((s) => (
              <div key={s.label}>
                <dt className="flex h-[1.875rem] items-center font-display text-3xl font-medium leading-none">
                  {s.n === "∞" ? (
                    <InfinityIcon className="h-9 w-9" strokeWidth={2.5} aria-label={s.label} />
                  ) : (
                    s.n
                  )}
                </dt>
                <dd className="mt-2 text-xs text-muted">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="lg:col-span-5">
          <HeroChatMock />
        </div>
      </div>
    </section>
  );
}

function HeroChatMock() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* offset hairline frame for depth — no glow */}
      <div
        aria-hidden
        className="absolute -right-3 -top-3 hidden h-full w-full rounded-[0.7rem] border border-line lg:block"
      />
      <div className="theme-invert card relative overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-[7px] bg-accent text-white">
            <Bot className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">SmartDesk AI</div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </div>
          </div>
        </div>
        <div className="space-y-4 px-5 py-6">
          <div className="ml-auto max-w-[78%] rounded-2xl rounded-br-sm bg-surface-2 px-4 py-2.5 text-sm">
            How do I get a refund?
          </div>
          <div className="max-w-[90%]">
            <div className="rounded-2xl rounded-bl-sm border border-line bg-bg px-4 py-3 text-sm leading-relaxed">
              You can request a refund within <span className="font-semibold">30 days</span> of purchase from
              Settings → Billing. It lands back in 5–7 business days.
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="chip">
                <FileText className="h-3 w-3" />
                refund-policy.pdf
              </span>
              <span className="text-xs text-subtle">96% match</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-line px-4 py-3">
          <div className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-subtle">
            Ask anything…
          </div>
          <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-accent text-white">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ tag, title, sub }: { tag: string; title: string; sub: string }) {
  return (
    <div className="mb-14 max-w-2xl">
      <p className="eyebrow text-accent-fg">{tag}</p>
      <h2 className="mt-4 text-balance font-display text-3xl font-medium tracking-tight md:text-[2.5rem]">{title}</h2>
      <p className="mt-4 text-pretty text-lg text-muted">{sub}</p>
    </div>
  );
}

const FEATURE_ICONS = [Upload, MessageSquare, Brain, Users, BarChart3, ShieldCheck];

function Features() {
  const { t } = useI18n();
  return (
    <section id="features" className="border-b border-line py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading tag={t.features.tag} title={t.features.title} sub={t.features.sub} />
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((it, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <div key={it.title} className="bg-bg p-7 transition-colors hover:bg-surface-2">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 flex-none text-accent-fg" strokeWidth={1.75} />
                  <h3 className="font-display text-lg font-medium">{it.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{it.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useI18n();
  return (
    <section id="how" className="border-b border-line bg-surface-2 py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading tag={t.how.tag} title={t.how.title} sub={t.how.sub} />
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
          {t.how.steps.map((s, i) => (
            <div key={s.title} className="bg-bg p-8">
              <div className="flex items-baseline gap-4">
                <span className="font-display text-4xl font-normal text-accent-fg">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-lg font-medium">{s.title}</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const { t } = useI18n();
  return (
    <section id="pricing" className="border-b border-line py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading tag={t.pricing.tag} title={t.pricing.title} sub={t.pricing.sub} />
        <div className="grid items-start gap-6 md:grid-cols-3">
          {t.pricing.tiers.map((tier, i) => {
            const highlight = i === 1;
            return (
              <div
                key={tier.name}
                className={`flex flex-col rounded-lg border bg-surface p-8 ${
                  highlight ? "border-accent/45" : "border-line"
                }`}
              >
                <PriceBody tier={tier} highlight={highlight} popular={t.pricing.popular} />
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
        <span className="font-display text-lg font-medium">{tier.name}</span>
        {highlight && <span className="eyebrow text-accent-fg">{popular}</span>}
      </div>
      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="font-display text-5xl font-medium tracking-tight">{tier.price}</span>
        <span className="text-sm text-muted">/ {tier.period}</span>
      </div>
      <ul className="mt-7 space-y-3 text-sm">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-muted">
            <Check className="mt-0.5 h-4 w-4 flex-none text-accent-fg" strokeWidth={2.25} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link href="/sign-up" className={`btn mt-8 w-full ${highlight ? "btn-accent" : "btn-outline"}`}>
        {tier.cta}
      </Link>
    </>
  );
}

function Demo() {
  const { t } = useI18n();
  const live = Boolean(process.env.NEXT_PUBLIC_DEMO_WIDGET_KEY);
  return (
    <section id="demo" className="border-b border-line bg-surface-2 py-24">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <p className="eyebrow text-accent-fg">{t.demo.tag}</p>
        <h2 className="mt-4 text-balance font-display text-3xl font-medium tracking-tight md:text-[2.5rem]">
          {live ? t.demo.titleLive : t.demo.titleIdle}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-muted">
          {live ? t.demo.bodyLive : t.demo.bodyIdle}
        </p>
        <div className="mx-auto mt-10 max-w-xl overflow-hidden rounded-lg border border-line bg-surface text-left">
          <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
            <span className="h-3 w-3 rounded-full" style={{ background: "#ff5f57" }} />
            <span className="h-3 w-3 rounded-full" style={{ background: "#febc2e" }} />
            <span className="h-3 w-3 rounded-full" style={{ background: "#28c840" }} />
            <span className="ml-2 font-mono text-xs text-subtle">index.html</span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed text-fg">
            <code>
              <span className="text-subtle">{"<script"}</span>
              {"\n  "}
              <span className="text-accent-fg">src</span>
              <span className="text-subtle">=</span>
              <span className="text-muted">{`"${WIDGET_SRC}"`}</span>
              {"\n  "}
              <span className="text-accent-fg">data-widget-key</span>
              <span className="text-subtle">=</span>
              <span className="text-muted">{'"wk_xxx"'}</span>
              {"\n  "}
              <span className="text-accent-fg">defer</span>
              {"\n"}
              <span className="text-subtle">{"></script>"}</span>
            </code>
          </pre>
        </div>
        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-xs text-subtle">
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
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-5">
        <div className="rounded-xl bg-fg px-6 py-16 text-center text-bg md:py-20">
          <h2 className="text-balance font-display text-3xl font-medium tracking-tight md:text-[2.5rem]">
            {t.cta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-pretty text-lg text-bg/70">{t.cta.sub}</p>
          <Link href="/sign-up" className="btn btn-accent group mt-9">
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
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-muted sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="grid h-5 w-5 place-items-center rounded-[5px] bg-accent text-white">
            <Bot className="h-3 w-3" strokeWidth={2.2} />
          </span>
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
