"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  FileText,
  Gauge,
  Hourglass,
  MessageSquare,
  Plus,
  Smile,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { DashboardNav } from "@/components/dashboard-nav";
import { useI18n, type Messages } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const CARD = "rounded-2xl border border-line bg-surface p-6";

interface Overview {
  conversations: number;
  messages: number;
  auto_resolved_pct: number;
  avg_confidence: number | null;
  satisfaction: { up: number; down: number; score: number | null };
  series: { day: string; count: number }[];
}

interface ConvRow {
  id: string;
  visitor: string;
  preview: string;
  status: string;
  confidence: number | null;
  message_count: number;
}

interface Doc {
  id: string;
  title: string | null;
  chunk_count: number;
  status: string;
}

export default function DashboardPage() {
  const { t } = useI18n();
  const callApi = useApi();
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    callApi<Overview>(`/api/analytics/overview?range=${range}`)
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [callApi, range]);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <DashboardNav />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.dashboard.title}</h1>
            <p className="mt-1 text-sm text-muted">{t.dashboard.subtitle}</p>
          </div>
          <Link
            href="/dashboard/knowledge"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50"
          >
            <Plus className="h-4 w-4" />
            {t.dashboard.upload}
          </Link>
        </div>

        <StatGrid data={data} loading={loading} t={t} />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ConversationsChart data={data} loading={loading} range={range} setRange={setRange} t={t} />
            <RecentConversations t={t} />
          </div>
          <aside className="space-y-6">
            <KnowledgeBaseCard t={t} />
            <WidgetEmbedCard t={t} />
          </aside>
        </div>
      </main>
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-2 ${className}`} />;
}

function StatGrid({ data, loading, t }: { data: Overview | null; loading: boolean; t: Messages }) {
  const pct = (n: number | null | undefined) => (n == null ? "—" : `${Math.round(n * 100)}%`);
  const stats: { label: string; value: string; icon: LucideIcon }[] = [
    { label: t.dashboard.statConversations, value: data ? data.conversations.toLocaleString() : "—", icon: MessageSquare },
    { label: t.dashboard.statAutoResolved, value: data ? `${data.auto_resolved_pct}%` : "—", icon: CheckCircle2 },
    { label: t.dashboard.statAvgConfidence, value: data ? pct(data.avg_confidence) : "—", icon: Gauge },
    { label: t.dashboard.statSatisfaction, value: data?.satisfaction.score != null ? `${data.satisfaction.score}/5` : "—", icon: Smile },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{s.label}</span>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-500/15 text-brand-fg">
              <s.icon className="h-4 w-4" />
            </span>
          </div>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-24" />
          ) : (
            <div className="mt-3 text-3xl font-bold tracking-tight">{s.value}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function ConversationsChart({
  data,
  loading,
  range,
  setRange,
  t,
}: {
  data: Overview | null;
  loading: boolean;
  range: "7d" | "30d";
  setRange: (r: "7d" | "30d") => void;
  t: Messages;
}) {
  const series = data?.series ?? [];
  const counts = series.map((p) => p.count);
  const max = Math.max(1, ...counts);
  const w = 600;
  const h = 160;
  const padX = 30; // horizontal padding so first/last date labels aren't clipped
  const padTop = 12;
  const innerW = w - padX * 2;
  const xAt = (i: number) => padX + (counts.length > 1 ? (i * innerW) / (counts.length - 1) : innerW / 2);
  const yAt = (c: number) => padTop + (1 - c / max) * (h - padTop);
  const path = counts.map((c, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(c).toFixed(1)}`).join(" ");
  const labelStep = Math.max(1, Math.ceil(counts.length / 7));

  return (
    <div className={CARD}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t.dashboard.chartTitle}</h2>
          <p className="text-sm text-muted">{range === "7d" ? t.dashboard.range7 : t.dashboard.range30}</p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as "7d" | "30d")}
          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-muted outline-none"
        >
          <option value="7d">{t.dashboard.range7}</option>
          <option value="30d">{t.dashboard.range30}</option>
        </select>
      </div>
      {loading ? (
        <Skeleton className="h-44 w-full" />
      ) : (
        <svg viewBox={`0 0 ${w} ${h + 26}`} className="w-full">
          <defs>
            <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((g) => {
            const gy = padTop + (h - padTop) * g;
            return <line key={g} x1={padX} x2={w - padX} y1={gy} y2={gy} stroke="rgba(148,163,184,0.18)" strokeWidth="1" />;
          })}
          {counts.length > 0 && (
            <path d={`${path} L ${xAt(counts.length - 1).toFixed(1)} ${h} L ${xAt(0).toFixed(1)} ${h} Z`} fill="url(#area)" />
          )}
          {counts.length > 0 && (
            <path d={path} fill="none" stroke="url(#stroke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {series.map((p, i) =>
            i % labelStep === 0 ? (
              <text key={p.day} x={xAt(i).toFixed(1)} y={h + 20} fill="#94a3b8" fontSize="11" textAnchor="middle">
                {p.day.slice(5)}
              </text>
            ) : null,
          )}
        </svg>
      )}
    </div>
  );
}

function statusBadge(status: string) {
  return status === "handoff"
    ? "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
    : "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
}

function RecentConversations({ t }: { t: Messages }) {
  const callApi = useApi();
  const [rows, setRows] = useState<ConvRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    callApi<ConvRow[]>("/api/chat/conversations?range=30d&limit=5")
      .then((r) => alive && setRows(r))
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, [callApi]);

  return (
    <div className={CARD}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.dashboard.recent}</h2>
        <Link
          href="/dashboard/conversations"
          className="inline-flex items-center gap-1 text-sm text-brand-fg transition hover:opacity-80"
        >
          {t.dashboard.viewAll} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {rows === null ? (
        <div className="space-y-3 py-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-subtle">{t.conversations.empty}</p>
      ) : (
        <div className="divide-y divide-line">
          {rows.map((c) => (
            <Link
              key={c.id}
              href="/dashboard/conversations"
              className="flex items-center gap-4 py-3 transition hover:opacity-90"
            >
              <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-surface-2 text-xs font-semibold text-muted">
                {c.visitor.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-fg">{c.preview || "—"}</div>
                <div className="text-xs text-subtle">{c.visitor} · {c.message_count} {t.conversations.messages}</div>
              </div>
              <div className="text-right">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(c.status)}`}>
                  {c.status === "handoff" ? t.dashboard.statusHandoff : t.dashboard.statusResolved}
                </span>
                {c.confidence != null && (
                  <div className="mt-1 text-xs text-subtle">
                    {t.dashboard.conf} {Math.round(c.confidence * 100)}%
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function KnowledgeBaseCard({ t }: { t: Messages }) {
  const callApi = useApi();
  const [docs, setDocs] = useState<Doc[] | null>(null);

  useEffect(() => {
    let alive = true;
    callApi<Doc[]>("/api/knowledge/documents")
      .then((d) => alive && setDocs(d))
      .catch(() => alive && setDocs([]));
    return () => {
      alive = false;
    };
  }, [callApi]);

  return (
    <div className={CARD}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.dashboard.kb}</h2>
        <Link href="/dashboard/knowledge" className="inline-flex items-center gap-1 text-sm text-brand-fg transition hover:opacity-80">
          {t.dashboard.manage} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {docs === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {docs.slice(0, 4).map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-2.5 text-sm">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-indigo-500/15 text-brand-fg">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{d.title ?? t.knowledge.untitled}</div>
                <div className="text-xs text-subtle">{d.chunk_count} {t.knowledge.chunks}</div>
              </div>
              {d.status === "ready" ? (
                <CheckCircle2 className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Hourglass className="h-4 w-4 flex-none text-amber-600 dark:text-amber-400" />
              )}
            </div>
          ))}
        </div>
      )}
      <Link
        href="/dashboard/knowledge"
        className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-3 text-sm text-muted transition hover:border-indigo-400/50 hover:text-brand-fg"
      >
        <Plus className="h-4 w-4" /> {t.dashboard.addDoc}
      </Link>
    </div>
  );
}

function WidgetEmbedCard({ t }: { t: Messages }) {
  const callApi = useApi();
  const [key, setKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    callApi<{ widget_key: string }>("/api/widget/settings")
      .then((s) => alive && setKey(s.widget_key))
      .catch(() => alive && setKey(null));
    return () => {
      alive = false;
    };
  }, [callApi]);

  const snippet = `<script
  src="https://cdn.smartdesk.ai/smartdesk.js"
  data-widget-key="${key ?? "wk_xxx"}"
  data-api-url="${API_URL}"
  defer
></script>`;

  return (
    <div className={CARD}>
      <h2 className="mb-1 text-lg font-semibold">{t.dashboard.embed}</h2>
      <p className="mb-3 text-sm text-muted">{t.dashboard.pasteBefore}</p>
      <pre className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950 p-3 text-xs leading-relaxed text-slate-300">
        {snippet}
      </pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(snippet);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface py-2 text-sm font-semibold transition hover:bg-surface-2"
      >
        {copied ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {t.widget.copied}
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" /> {t.dashboard.copy}
          </>
        )}
      </button>
    </div>
  );
}
