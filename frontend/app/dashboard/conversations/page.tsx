"use client";

import { MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { DashboardNav } from "@/components/dashboard-nav";
import { useI18n, type Messages } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";

interface ConvRow {
  id: string;
  visitor: string;
  preview: string;
  status: string;
  confidence: number | null;
  message_count: number;
  last_at: string | null;
}

interface Msg {
  id: string;
  role: string;
  content: string;
  citations: { title: string | null; score: number; snippet: string }[];
  confidence: number | null;
  feedback: string | null;
}

interface Detail {
  id: string;
  visitor: string;
  status: string;
  created_at: string | null;
  messages: Msg[];
}

const CARD = "rounded-2xl border border-line bg-surface";

function badge(status: string) {
  return status === "handoff"
    ? "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
    : "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
}

export default function ConversationsPage() {
  const { t } = useI18n();
  const callApi = useApi();
  const [range, setRange] = useState<"7d" | "30d">("30d");
  const [status, setStatus] = useState<"all" | "resolved" | "handoff">("all");
  const [rows, setRows] = useState<ConvRow[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    let alive = true;
    setRows(null);
    callApi<ConvRow[]>(`/api/chat/conversations?range=${range}&status=${status}&limit=100`)
      .then((r) => alive && setRows(r))
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, [callApi, range, status]);

  const open = useCallback(
    (id: string) => {
      setSelected(id);
      setDetail(null);
      callApi<Detail>(`/api/chat/conversations/${id}`)
        .then(setDetail)
        .catch(() => setDetail(null));
    },
    [callApi],
  );

  return (
    <div className="min-h-screen bg-bg text-fg">
      <DashboardNav />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t.conversations.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.conversations.subtitle}</p>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-line bg-surface p-0.5 text-sm">
            {(["all", "resolved", "handoff"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-md px-3 py-1 transition ${
                  status === s ? "bg-brand text-white" : "text-muted hover:text-fg"
                }`}
              >
                {t.conversations[s]}
              </button>
            ))}
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

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* List */}
          <div className={`${CARD} max-h-[70vh] overflow-y-auto p-2`}>
            {rows === null ? (
              <div className="space-y-2 p-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <p className="p-8 text-center text-sm text-subtle">{t.conversations.empty}</p>
            ) : (
              rows.map((c) => (
                <button
                  key={c.id}
                  onClick={() => open(c.id)}
                  className={`mb-1 flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${
                    selected === c.id ? "bg-surface-2" : "hover:bg-surface-2"
                  }`}
                >
                  <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-surface-2 text-xs text-muted">
                    {c.visitor.slice(-2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-fg">{c.preview || "—"}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-subtle">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${badge(c.status)}`}>
                        {c.status === "handoff" ? t.dashboard.statusHandoff : t.dashboard.statusResolved}
                      </span>
                      <span>{c.message_count} {t.conversations.messages}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Transcript */}
          <div className={`${CARD} min-h-[60vh] p-6`}>
            {!selected ? (
              <div className="flex h-full flex-col items-center justify-center py-20 text-center text-subtle">
                <span className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-indigo-500/15 text-brand-fg">
                  <MessageSquare className="h-6 w-6" />
                </span>
                {t.conversations.selectHint}
              </div>
            ) : detail === null ? (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-2" />
                ))}
              </div>
            ) : (
              <Transcript detail={detail} t={t} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Transcript({ detail, t }: { detail: Detail; t: Messages }) {
  return (
    <>
      <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
        <div>
          <div className="font-semibold">{detail.visitor}</div>
          <div className="text-xs text-subtle">
            {detail.created_at ? new Date(detail.created_at).toLocaleString() : ""}
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge(detail.status)}`}>
          {detail.status === "handoff" ? t.dashboard.statusHandoff : t.dashboard.statusResolved}
        </span>
      </div>
      <div className="space-y-4">
        {detail.messages.map((m) =>
          m.role === "user" ? (
            <div
              key={m.id}
              className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-white"
            >
              {m.content}
            </div>
          ) : (
            <div key={m.id} className="max-w-[90%]">
              <div className="whitespace-pre-wrap rounded-2xl rounded-bl-md border border-line bg-surface-2 px-4 py-3 text-fg">
                {m.content}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-subtle">
                {m.confidence != null && <span>{t.chat.confidence} {Math.round(m.confidence * 100)}%</span>}
                {m.feedback === "positive" && <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />}
                {m.feedback === "negative" && <ThumbsDown className="h-3.5 w-3.5 text-amber-500" />}
              </div>
              {m.citations?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {m.citations.map((c, i) => (
                    <details key={i} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs">
                      <summary className="cursor-pointer text-muted">
                        [{i + 1}] {c.title ?? t.chat.document} · {Math.round(c.score * 100)}% {t.chat.match}
                      </summary>
                      <p className="mt-1 text-subtle">{c.snippet}…</p>
                    </details>
                  ))}
                </div>
              )}
            </div>
          ),
        )}
      </div>
    </>
  );
}
