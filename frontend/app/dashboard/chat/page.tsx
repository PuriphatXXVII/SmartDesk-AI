"use client";

import Link from "next/link";
import { useRef, useState } from "react";

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
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">Test your AI</h1>
          <p className="text-gray-500">
            Ask questions about your uploaded docs.{" "}
            <Link href="/dashboard/knowledge" className="text-brand">Manage knowledge →</Link>
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border bg-white p-6">
          {turns.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              👋 Ask me anything about your knowledge base.
            </div>
          )}
          {turns.map((t, i) => (
            <Bubble key={i} turn={t} />
          ))}
          {loading && <div className="text-sm text-gray-400">thinking…</div>}
        </div>

        <form onSubmit={send} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question…"
            className="flex-1 rounded-lg border px-4 py-3 outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
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
      <div className="ml-auto max-w-[80%] rounded-2xl bg-brand px-4 py-2 text-white">
        {turn.content}
      </div>
    );
  }
  return (
    <div className="max-w-[90%]">
      <div className="whitespace-pre-wrap rounded-2xl bg-gray-100 px-4 py-3">{turn.content}</div>
      {turn.confidence !== undefined && (
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <span>confidence {(turn.confidence * 100).toFixed(0)}%</span>
          {turn.flagged && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">
              would hand off to human
            </span>
          )}
        </div>
      )}
      {turn.citations && turn.citations.length > 0 && (
        <div className="mt-2 space-y-1">
          {turn.citations.map((c, i) => (
            <details key={i} className="rounded border bg-white px-3 py-1 text-xs">
              <summary className="cursor-pointer text-gray-600">
                [{i + 1}] {c.title ?? "document"} · {(c.score * 100).toFixed(0)}% match
              </summary>
              <p className="mt-1 text-gray-500">{c.snippet}…</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold">
          🤖 SmartDesk <span className="text-brand">AI</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="text-gray-600 hover:text-brand">Dashboard</Link>
          <span className="font-semibold text-brand">Test Chat</span>
          <Link href="/dashboard/knowledge" className="text-gray-600 hover:text-brand">Knowledge</Link>
        </nav>
      </div>
    </header>
  );
}
