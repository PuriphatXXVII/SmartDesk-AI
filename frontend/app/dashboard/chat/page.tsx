"use client";

import Link from "next/link";
import { ArrowRight, Send, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

import { DashboardNav } from "@/components/dashboard-nav";
import { useI18n, type Messages } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";

interface Citation {
  document_id: string;
  title: string | null;
  score: number;
  snippet: string;
}

interface QueryResponse {
  conversation_id: string;
  answer: string;
  confidence: number;
  citations: Citation[];
  flagged_for_handoff: boolean;
}

interface Turn {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  confidence?: number;
  flagged?: boolean;
}

export default function ChatPage() {
  const callApi = useApi();
  const { t } = useI18n();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const convId = useRef<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setTurns((t) => [...t, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await callApi<QueryResponse>("/api/chat/query", {
        method: "POST",
        body: JSON.stringify({ question: q, conversation_id: convId.current }),
      });
      convId.current = res.conversation_id;
      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer,
          citations: res.citations,
          confidence: res.confidence,
          flagged: res.flagged_for_handoff,
        },
      ]);
    } catch (err) {
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${err instanceof Error ? err.message : "error"}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <DashboardNav />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
        <div className="mb-5">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t.chat.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {t.chat.subtitle}{" "}
            <Link
              href="/dashboard/knowledge"
              className="inline-flex items-center gap-0.5 text-accent-fg transition hover:opacity-80"
            >
              {t.chat.manageKnowledge} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-line bg-surface p-6">
          {turns.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-subtle">
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-accent-soft text-accent-fg">
                <Sparkles className="h-6 w-6" />
              </span>
              {t.chat.empty}
            </div>
          )}
          {turns.map((turn, i) => (
            <Bubble key={i} turn={turn} t={t} />
          ))}
          {loading && (
            <div className="flex items-center gap-1.5 text-sm text-subtle">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" />
            </div>
          )}
        </div>

        <form onSubmit={send} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.chat.placeholder}
            className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-fg placeholder:text-subtle outline-none transition focus:border-accent"
          />
          <button type="submit" disabled={loading} className="btn btn-accent disabled:opacity-50">
            <Send className="h-4 w-4" />
            {t.chat.send}
          </button>
        </form>
      </main>
    </div>
  );
}

function Bubble({ turn, t }: { turn: Turn; t: Messages }) {
  if (turn.role === "user") {
    return (
      <div className="ml-auto max-w-[80%] animate-in fade-in slide-in-from-bottom-1 duration-200 rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-white">
        {turn.content}
      </div>
    );
  }
  return (
    <div className="max-w-[90%] animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="whitespace-pre-wrap rounded-2xl rounded-bl-md border border-line bg-surface-2 px-4 py-3 text-fg">
        {turn.content}
      </div>
      {turn.confidence !== undefined && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-subtle">
          <span>{t.chat.confidence} {(turn.confidence * 100).toFixed(0)}%</span>
          {turn.flagged && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              {t.chat.handoff}
            </span>
          )}
        </div>
      )}
      {turn.citations && turn.citations.length > 0 && (
        <div className="mt-2 space-y-1">
          {turn.citations.map((c, i) => (
            <details
              key={i}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs"
            >
              <summary className="cursor-pointer text-muted">
                [{i + 1}] {c.title ?? t.chat.document} · {(c.score * 100).toFixed(0)}% {t.chat.match}
              </summary>
              <p className="mt-1 text-subtle">{c.snippet}…</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
