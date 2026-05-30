import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Hourglass,
  MessageSquare,
  Plus,
  Smile,
  TrendingUp,
} from "lucide-react";

import { DashboardNav } from "@/components/dashboard-nav";

const CARD = "rounded-2xl border border-white/10 bg-white/[0.03] p-6";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <DashboardNav />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Last 7 days · Acme Inc.</p>
          </div>
          <Link
            href="/dashboard/knowledge"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50"
          >
            <Plus className="h-4 w-4" />
            Upload Document
          </Link>
        </div>

        <StatGrid />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ConversationsChart />
            <RecentConversations />
          </div>
          <aside className="space-y-6">
            <KnowledgeBaseCard />
            <WidgetEmbedCard />
          </aside>
        </div>
      </main>
    </div>
  );
}

function StatGrid() {
  const stats = [
    { label: "Conversations", value: "1,247", delta: "+12%", icon: MessageSquare },
    { label: "Auto-resolved", value: "83%", delta: "+5%", icon: CheckCircle2 },
    { label: "Avg. response", value: "1.4s", delta: "−0.2s", icon: Clock },
    { label: "Satisfaction", value: "4.6/5", delta: "+0.1", icon: Smile },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{s.label}</span>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-500/15 text-indigo-300">
              <s.icon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-bold tracking-tight">{s.value}</div>
          <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            {s.delta} vs last week
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationsChart() {
  // Hand-rolled SVG sparkline — no chart lib needed for the demo.
  const points = [40, 52, 48, 65, 78, 70, 95];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const max = Math.max(...points);
  const w = 600;
  const h = 160;
  const stepX = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${h - (p / max) * h}`)
    .join(" ");
  return (
    <div className={CARD}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Conversations / day</h2>
          <p className="text-sm text-slate-400">Last 7 days</p>
        </div>
        <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 outline-none">
          <option className="bg-slate-900">Last 7 days</option>
          <option className="bg-slate-900">Last 30 days</option>
        </select>
      </div>
      <svg viewBox={`0 0 ${w} ${h + 24}`} className="w-full">
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
        ))}
        <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#area)" />
        <path
          d={path}
          fill="none"
          stroke="url(#stroke)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={i * stepX} cy={h - (p / max) * h} r="3.5" fill="#a78bfa" />
        ))}
        {days.map((d, i) => (
          <text key={d} x={i * stepX} y={h + 18} fill="#64748b" fontSize="11" textAnchor="middle">
            {d}
          </text>
        ))}
      </svg>
    </div>
  );
}

function RecentConversations() {
  const convs = [
    { who: "anon-3f2", q: "How do I reset my password?", time: "2 min ago", status: "resolved", confidence: 0.94 },
    { who: "anon-8d1", q: "Can I integrate with Slack?", time: "11 min ago", status: "resolved", confidence: 0.88 },
    { who: "anon-4a0", q: "Refund policy for annual plans?", time: "23 min ago", status: "handoff", confidence: 0.42 },
    { who: "anon-9c5", q: "Does the widget work on mobile?", time: "1 hr ago", status: "resolved", confidence: 0.91 },
    { who: "anon-2b8", q: "Where do I find my API key?", time: "2 hr ago", status: "resolved", confidence: 0.97 },
  ];
  return (
    <div className={CARD}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent conversations</h2>
        <a className="inline-flex items-center gap-1 text-sm text-indigo-400 transition hover:text-indigo-300">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="divide-y divide-white/5">
        {convs.map((c, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white/5 text-xs text-slate-300">
              {c.who.slice(-2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-slate-100">{c.q}</div>
              <div className="text-xs text-slate-500">{c.who} · {c.time}</div>
            </div>
            <div className="text-right">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  c.status === "resolved"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-amber-500/15 text-amber-300"
                }`}
              >
                {c.status}
              </span>
              <div className="mt-1 text-xs text-slate-500">conf. {(c.confidence * 100).toFixed(0)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KnowledgeBaseCard() {
  const docs = [
    { name: "User Guide.pdf", chunks: 47, status: "ready" },
    { name: "FAQ.docx", chunks: 23, status: "ready" },
    { name: "API Reference.md", chunks: 89, status: "ready" },
    { name: "Pricing Page (URL)", chunks: 12, status: "processing" },
  ];
  return (
    <div className={CARD}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Knowledge base</h2>
        <Link
          href="/dashboard/knowledge"
          className="inline-flex items-center gap-1 text-sm text-indigo-400 transition hover:text-indigo-300"
        >
          Manage <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="space-y-2">
        {docs.map((d) => (
          <div
            key={d.name}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-sm"
          >
            <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-indigo-500/15 text-indigo-300">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{d.name}</div>
              <div className="text-xs text-slate-500">{d.chunks} chunks</div>
            </div>
            {d.status === "ready" ? (
              <CheckCircle2 className="h-4 w-4 flex-none text-emerald-400" />
            ) : (
              <Hourglass className="h-4 w-4 flex-none text-amber-400" />
            )}
          </div>
        ))}
      </div>
      <Link
        href="/dashboard/knowledge"
        className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 py-3 text-sm text-slate-400 transition hover:border-indigo-400/50 hover:text-indigo-300"
      >
        <Plus className="h-4 w-4" /> Add document
      </Link>
    </div>
  );
}

function WidgetEmbedCard() {
  return (
    <div className={CARD}>
      <h2 className="mb-1 text-lg font-semibold">Embed snippet</h2>
      <p className="mb-3 text-sm text-slate-400">Paste before &lt;/body&gt; on your site:</p>
      <pre className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950 p-3 text-xs leading-relaxed text-slate-300">
{`<script
  src="https://cdn.smartdesk.ai/widget.js"
  data-widget-key="wk_demo_acme_inc"
  defer
></script>`}
      </pre>
      <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-sm font-semibold transition hover:bg-white/10">
        <Copy className="h-4 w-4" /> Copy snippet
      </button>
    </div>
  );
}
