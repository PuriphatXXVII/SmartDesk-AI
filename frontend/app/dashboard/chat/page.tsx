"use client";

import Link from "next/link";
import { ArrowRight, Send, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

import { DashboardNav } from "@/components/dashboard-nav";
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
      setTurns((t) => [
        ...t,
        {
          role: "assistant",
          content: res.answer,
          citations: res.citations,
          confidence: res.confidence,
          flagged: res.flagged_for_handoff,
        },
      ]);
    } catch (err) {
      setTurns((t) => [
        ...t,
        { role: "assistant", content: `⚠️ ${err instanceof Error ? err.message : "error"}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <DashboardNav />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
        <div className="mb-5">
          <h1 className="text-3xl font-bold tracking-tight">Test your AI</h1>
          <p className="mt-1 text-sm text-slate-400">
            Ask questions about your uploaded docs.{" "}
            <Link
              href="/dashboard/knowledge"
              className="inline-flex items-center gap-0.5 text-indigo-400 transition hover:text-indigo-300"
            >
              Manage knowledge <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          {turns.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300">
                <Sparkles className="h-6 w-6" />
              </span>
              Ask me anything about your knowledge base.
            </div>
          )}
          {turns.map((t, i) => (
            <Bubble key={i} turn={t} />
          ))}
          {loading && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
            </div>
          )}
        </div>

        <form onSubmit={send} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question…"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-400/60 focus:bg-white/[0.07]"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </form>
      </main>
    </div>
  );
}

function Bubble({ turn }: { turn: Turn }) {
  if (turn.role === "user") {
    return (
      <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-white shadow-lg shadow-indigo-500/20">
        {turn.content}
      </div>
    );
  }
  return (
    <div className="max-w-[90%]">
      <div className="whitespace-pre-wrap rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-3 text-slate-100">
        {turn.content}
      </div>
      {turn.confidence !== undefined && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
          <span>confidence {(turn.confidence * 100).toFixed(0)}%</span>
          {turn.flagged && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-300">
              would hand off to human
            </span>
          )}
        </div>
      )}
      {turn.citations && turn.citations.length > 0 && (
        <div className="mt-2 space-y-1">
          {turn.citations.map((c, i) => (
            <details
              key={i}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs"
            >
              <summary className="cursor-pointer text-slate-300">
                [{i + 1}] {c.title ?? "document"} · {(c.score * 100).toFixed(0)}% match
              </summary>
              <p className="mt-1 text-slate-400">{c.snippet}…</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
