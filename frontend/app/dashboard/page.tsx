import Link from "next/link";

import { AccountInfo } from "@/components/account-info";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-500">Last 7 days · Acme Inc.</p>
          </div>
          <Link
            href="/dashboard/knowledge"
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
          >
            + Upload Document
          </Link>
        </div>

        <StatGrid />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
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

function DashboardHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold">
          🤖 SmartDesk <span className="text-brand">AI</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <a className="font-semibold text-brand">Dashboard</a>
          <Link href="/dashboard/chat" className="text-gray-600 hover:text-brand">Test Chat</Link>
          <Link href="/dashboard/knowledge" className="text-gray-600 hover:text-brand">Knowledge</Link>
          <a className="text-gray-600 hover:text-brand">Widget</a>
          <a className="text-gray-600 hover:text-brand">Settings</a>
          <AccountInfo />
        </nav>
      </div>
    </header>
  );
}

function StatGrid() {
  const stats = [
    { label: "Conversations", value: "1,247", delta: "+12% vs last week", positive: true },
    { label: "Auto-resolved", value: "83%", delta: "+5% vs last week", positive: true },
    { label: "Avg. response", value: "1.4s", delta: "−0.2s vs last week", positive: true },
    { label: "Satisfaction", value: "4.6/5", delta: "+0.1 vs last week", positive: true },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">{s.label}</div>
          <div className="mt-1 text-3xl font-bold">{s.value}</div>
          <div className={`mt-2 text-xs ${s.positive ? "text-green-600" : "text-red-600"}`}>{s.delta}</div>
        </div>
      ))}
    </div>
  );
}

function ConversationsChart() {
  // Simple SVG sparkline — no chart lib needed for the demo
  const points = [40, 52, 48, 65, 78, 70, 95];
  const max = Math.max(...points);
  const w = 600;
  const h = 160;
  const stepX = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${h - (p / max) * h}`)
    .join(" ");
  return (
    <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Conversations / day</h2>
          <p className="text-sm text-gray-500">Last 7 days</p>
        </div>
        <select className="rounded border bg-white px-3 py-1 text-sm">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
        </select>
      </div>
      <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#grad)" />
        <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2.5" />
        {points.map((p, i) => (
          <circle key={i} cx={i * stepX} cy={h - (p / max) * h} r="4" fill="#3b82f6" />
        ))}
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
          <text key={d} x={i * stepX} y={h + 15} fill="#9ca3af" fontSize="11" textAnchor="middle">
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
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Recent conversations</h2>
        <a className="text-sm text-brand">View all →</a>
      </div>
      <div className="divide-y">
        {convs.map((c, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 text-center text-xs leading-8">
              {c.who.slice(-2)}
            </div>
            <div className="flex-1">
              <div className="font-medium">{c.q}</div>
              <div className="text-xs text-gray-500">{c.who} · {c.time}</div>
            </div>
            <div className="text-right">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                  c.status === "resolved"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {c.status}
              </span>
              <div className="mt-1 text-xs text-gray-500">conf. {(c.confidence * 100).toFixed(0)}%</div>
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
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Knowledge base</h2>
        <Link href="/dashboard/knowledge" className="text-sm text-brand">Manage →</Link>
      </div>
      <div className="space-y-2">
        {docs.map((d) => (
          <div key={d.name} className="flex items-center gap-3 rounded border p-2 text-sm">
            <span>📄</span>
            <div className="flex-1">
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-gray-500">{d.chunks} chunks</div>
            </div>
            <span
              className={`text-xs ${
                d.status === "ready" ? "text-green-600" : "text-orange-500"
              }`}
            >
              {d.status === "ready" ? "✓" : "⏳"}
            </span>
          </div>
        ))}
      </div>
      <Link
        href="/dashboard/knowledge"
        className="mt-4 block w-full rounded-lg border border-dashed border-gray-300 py-3 text-center text-sm text-gray-600 hover:border-brand hover:text-brand"
      >
        + Add document
      </Link>
    </div>
  );
}

function WidgetEmbedCard() {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-bold">Embed snippet</h2>
      <p className="mb-3 text-sm text-gray-500">Paste before &lt;/body&gt; on your site:</p>
      <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-xs text-green-400">
{`<script
  src="https://cdn.smartdesk.ai/widget.js"
  data-widget-key="wk_demo_acme_inc"
  defer
></script>`}
      </pre>
      <button className="mt-3 w-full rounded-lg bg-gray-100 py-2 text-sm font-semibold hover:bg-gray-200">
        Copy snippet
      </button>
    </div>
  );
}
