import Link from "next/link";

import { WidgetEmbed } from "@/components/widget-embed";

const DEMO_WIDGET_KEY = process.env.NEXT_PUBLIC_DEMO_WIDGET_KEY ?? "";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Demo />
      <Footer />
      <WidgetEmbed widgetKey={DEMO_WIDGET_KEY} apiUrl={API_URL} />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <div className="text-xl font-bold">
          🤖 SmartDesk <span className="text-brand">AI</span>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#features" className="hover:text-brand">Features</a>
          <a href="#how" className="hover:text-brand">How it works</a>
          <a href="#pricing" className="hover:text-brand">Pricing</a>
          <Link
            href="/dashboard"
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
          >
            Open Dashboard →
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="bg-gradient-to-b from-white to-blue-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-6 rounded-full border border-brand/20 bg-brand/5 px-4 py-1 text-sm text-brand">
          🚀 RAG-powered · Multi-tenant · Self-hostable
        </div>
        <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
          Turn your docs into a{" "}
          <span className="text-brand">24/7 AI support agent</span>
        </h1>
        <p className="mb-10 max-w-2xl text-xl text-gray-600">
          Upload your knowledge base. Embed one line of code. Let SmartDesk AI
          handle 80% of customer questions — accurately and instantly.
        </p>
        <div className="flex gap-4">
          <Link
            href="/sign-up"
            className="rounded-lg bg-brand px-8 py-4 font-semibold text-white shadow-lg hover:bg-brand-dark"
          >
            Start Free
          </Link>
          <a
            href="#demo"
            className="rounded-lg border border-gray-300 bg-white px-8 py-4 font-semibold hover:bg-gray-50"
          >
            See Live Demo
          </a>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-8 text-sm text-gray-500">
          <Stat n="80%" label="Questions auto-resolved" />
          <Stat n="<2s" label="Median response time" />
          <Stat n="∞" label="Conversations / month" />
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold text-brand">{n}</div>
      <div>{label}</div>
    </div>
  );
}

function Features() {
  const items = [
    { icon: "📄", title: "Upload anything", body: "PDF, DOCX, Markdown, or full website crawl. We chunk, embed, and index it for you." },
    { icon: "💬", title: "Embeddable widget", body: "One <script> tag and your site has a 24/7 AI agent. Customize colors, position, and persona." },
    { icon: "🧠", title: "RAG with citations", body: "Every answer cites the source so users (and you) can verify it." },
    { icon: "👥", title: "Human handoff", body: "Low-confidence chats are flagged. Agents can jump in live via the dashboard." },
    { icon: "📊", title: "Analytics dashboard", body: "Top questions, satisfaction rate, where AI struggles — all in one view." },
    { icon: "🔐", title: "Multi-tenant + secure", body: "Row-level org isolation, CSP, HSTS, rate-limiting, PII redaction. SOC 2 prep underway." },
  ];
  return (
    <section id="features" className="border-t bg-white py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="mb-2 text-center text-4xl font-bold">Everything you need to ship support AI</h2>
        <p className="mb-16 text-center text-lg text-gray-600">From upload to embedded widget — in under 10 minutes.</p>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="rounded-xl border bg-white p-6 transition hover:border-brand hover:shadow-md">
              <div className="mb-4 text-3xl">{it.icon}</div>
              <h3 className="mb-2 text-lg font-bold">{it.title}</h3>
              <p className="text-gray-600">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: 1, title: "Upload your knowledge", body: "Drag PDFs, paste URLs, or connect Notion / Confluence. We parse & embed in seconds." },
    { n: 2, title: "Customize your widget", body: "Brand colors, welcome message, persona. Preview live before publishing." },
    { n: 3, title: "Embed one line of code", body: "Copy the <script> snippet. Drop on your site. Done." },
  ];
  return (
    <section id="how" className="border-t bg-gray-50 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="mb-16 text-center text-4xl font-bold">How it works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border bg-white p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                {s.n}
              </div>
              <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
              <p className="text-gray-600">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    { name: "Free", price: "$0", period: "forever", features: ["100 conversations/mo", "1 knowledge base", "Community support"], cta: "Start free", highlight: false },
    { name: "Pro", price: "$29", period: "per month", features: ["5,000 conversations/mo", "Unlimited knowledge bases", "Email support", "Custom branding"], cta: "Start trial", highlight: true },
    { name: "Business", price: "$99", period: "per month", features: ["50,000 conversations/mo", "Multi-user team", "Priority support", "SSO + audit logs"], cta: "Contact sales", highlight: false },
  ];
  return (
    <section id="pricing" className="border-t bg-white py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="mb-2 text-center text-4xl font-bold">Simple, honest pricing</h2>
        <p className="mb-16 text-center text-lg text-gray-600">No per-seat tax. No hidden tokens. Cancel anytime.</p>
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`rounded-2xl border p-8 ${t.highlight ? "border-brand bg-brand/5 shadow-xl" : "bg-white"}`}
            >
              {t.highlight && (
                <div className="mb-4 inline-block rounded-full bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  Most popular
                </div>
              )}
              <div className="mb-1 text-2xl font-bold">{t.name}</div>
              <div className="mb-6">
                <span className="text-5xl font-bold">{t.price}</span>
                <span className="text-gray-500"> / {t.period}</span>
              </div>
              <ul className="mb-8 space-y-2 text-gray-700">
                {t.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className={`block rounded-lg px-4 py-3 text-center font-semibold ${
                  t.highlight
                    ? "bg-brand text-white hover:bg-brand-dark"
                    : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Demo() {
  const live = Boolean(process.env.NEXT_PUBLIC_DEMO_WIDGET_KEY);
  return (
    <section id="demo" className="border-t bg-gray-900 py-24 text-white">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="mb-6 text-4xl font-bold">
          {live ? "👇 The widget is live on this page" : "Try the widget right here"}
        </h2>
        <p className="mb-10 text-lg text-gray-300">
          {live
            ? "Look at the bottom-right corner — that 💬 bubble is the real SmartDesk widget, talking to the same RAG backend that powers customer deployments. Click it and ask anything."
            : "Once a demo widget key is configured, a real chat bubble appears on this page powered by the same backend customers use in production."}
        </p>
        <pre className="mx-auto max-w-xl overflow-x-auto rounded-lg bg-black/40 p-4 text-left text-xs text-green-400">
{`<script
  src="https://cdn.smartdesk.ai/smartdesk.js"
  data-widget-key="wk_xxx"
  defer
></script>`}
        </pre>
        <p className="mt-6 text-sm text-gray-400">
          One script tag · 5.5KB · Real-time streaming · Cites its sources
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-white py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-sm text-gray-500">
        <div>© 2026 SmartDesk AI · Built with Next.js, FastAPI &amp; Claude</div>
        <div className="flex gap-4">
          <a href="https://github.com/PuriphatXXVII/SmartDesk-AI" target="_blank" rel="noopener noreferrer" className="hover:text-brand">
            GitHub
          </a>
          <a href="#features" className="hover:text-brand">Features</a>
          <a href="#pricing" className="hover:text-brand">Pricing</a>
        </div>
      </div>
    </footer>
  );
}
