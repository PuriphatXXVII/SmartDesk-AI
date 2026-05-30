"use client";

import { CheckCircle2, MessageSquare, Send, ThumbsDown, ThumbsUp } from "lucide-react";
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

  const loadList = useCallback(async () => {
    try {
      setRows(await callApi<ConvRow[]>(`/api/chat/conversations?range=${range}&status=${status}&limit=100`));
    } catch {
      setRows([]);
    }
  }, [callApi, range, status]);

  useEffect(() => {
    setRows(null);
    loadList();
  }, [loadList]);

  const reloadDetail = useCallback(
    (id: string) => callApi<Detail>(`/api/chat/conversations/${id}`).then(setDetail).catch(() => undefined),
    [callApi],
  );

  const open = useCallback(
    (id: string) => {
      setSelected(id);
      setDetail(null);
      reloadDetail(id);
    },
    [reloadDetail],
  );

  const reply = useCallback(
    async (content: string) => {
      if (!selected) return;
      await callApi(`/api/chat/conversations/${selected}/reply`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      await reloadDetail(selected);
      loadList();
    },
    [callApi, selected, reloadDetail, loadList],
  );

  const resolve = useCallback(async () => {
    if (!selected) return;
    await callApi(`/api/chat/conversations/${selected}/status`, {
      method: "POST",
      body: JSON.stringify({ status: "resolved" }),
    });
    await reloadDetail(selected);
    loadList();
  }, [callApi, selected, reloadDetail, loadList]);

  // Near-realtime (dashboard side): poll the list + the open transcript every 3s so
  // new visitor messages, new conversations, and status changes appear without a
  // manual refresh. (The widget side already gets agent replies pushed live via WS.)
  useEffect(() => {
    const t = setInterval(() => {
      loadList();
      if (selected) reloadDetail(selected);
    }, 3000);
    return () => clearInterval(t);
  }, [loadList, reloadDetail, selected]);

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
          <div className={`${CARD} flex min-h-[60vh] flex-col p-6`}>
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center py-20 text-center text-subtle">
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
              <Transcript detail={detail} t={t} onReply={reply} onResolve={resolve} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Transcript({
  detail,
  t,
  onReply,
  onResolve,
}: {
  detail: Detail;
  t: Messages;
  onReply: (content: string) => Promise<void>;
  onResolve: () => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const c = text.trim();
    if (!c || sending) return;
    setSending(true);
    try {
      await onReply(c);
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
        <div>
          <div className="font-semibold">{detail.visitor}</div>
          <div className="text-xs text-subtle">
            {detail.created_at ? new Date(detail.created_at).toLocaleString() : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge(detail.status)}`}>
            {detail.status === "handoff" ? t.dashboard.statusHandoff : t.dashboard.statusResolved}
          </span>
          {detail.status !== "resolved" && (
            <button
              onClick={async () => {
                setResolving(true);
                try {
                  await onResolve();
                } finally {
                  setResolving(false);
                }
              }}
              disabled={resolving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold transition hover:bg-surface-2 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t.conversations.resolve}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {detail.messages.map((m) => {
          if (m.role === "user") {
            return (
              <div
                key={m.id}
                className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-white"
              >
                {m.content}
              </div>
            );
          }
          if (m.role === "agent") {
            return (
              <div key={m.id} className="ml-auto max-w-[85%]">
                <div className="mb-1 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {t.conversations.agent}
                </div>
                <div className="whitespace-pre-wrap rounded-2xl rounded-br-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-fg">
                  {m.content}
                </div>
              </div>
            );
          }
          return (
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
          );
        })}
      </div>

      {/* Agent reply composer */}
      <form onSubmit={send} className="mt-4 flex gap-2 border-t border-line pt-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.conversations.replyPlaceholder}
          className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg placeholder:text-subtle outline-none transition focus:border-indigo-400/60"
        />
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {t.conversations.reply}
        </button>
      </form>
    </>
  );
}
