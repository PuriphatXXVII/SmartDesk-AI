"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { useApi } from "@/lib/use-api";

interface Doc {
  id: string;
  title: string | null;
  source_type: string;
  status: string;
  chunk_count: number;
  created_at: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const ACCEPT = ".pdf,.docx,.txt,.md,.html";

export default function KnowledgePage() {
  const callApi = useApi();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      setDocs(await callApi<Doc[]>("/api/knowledge/documents"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to load");
    }
  }, [callApi]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll while any doc is still processing.
  useEffect(() => {
    if (!docs.some((d) => d.status === "pending" || d.status === "processing")) return;
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [docs, refresh]);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      // Multipart upload can't go through the JSON api() helper, so call fetch
      // directly and attach the Clerk token ourselves.
      const form = new FormData();
      form.append("file", file);
      const token = await getClerkToken();
      const res = await fetch(`${API_URL}/api/knowledge/documents/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(id: string) {
    try {
      await callApi(`/api/knowledge/documents/${id}`, { method: "DELETE" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "delete failed");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Knowledge base</h1>
            <p className="text-gray-500">Upload docs — they’re parsed, chunked & embedded for your AI.</p>
          </div>
          <Link href="/dashboard/chat" className="rounded-lg border px-4 py-2 font-semibold hover:bg-gray-100">
            Test your AI →
          </Link>
        </div>

        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition ${
            uploading ? "opacity-60" : "hover:border-brand hover:bg-white"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <div className="text-4xl">📄</div>
          <div className="mt-2 font-semibold">
            {uploading ? "Uploading…" : "Click to upload a document"}
          </div>
          <div className="text-sm text-gray-500">PDF, DOCX, TXT, MD, HTML · up to 25MB</div>
        </label>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Documents ({docs.length})</h2>
          {docs.length === 0 ? (
            <p className="rounded-lg border bg-white p-6 text-center text-gray-500">
              No documents yet. Upload one above to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center gap-4 rounded-lg border bg-white p-4">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1">
                    <div className="font-medium">{d.title ?? "Untitled"}</div>
                    <div className="text-xs text-gray-500">
                      {d.source_type} · {d.chunk_count} chunks
                    </div>
                  </div>
                  <StatusBadge status={d.status} />
                  <button
                    onClick={() => remove(d.id)}
                    className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ready: "bg-green-100 text-green-700",
    processing: "bg-blue-100 text-blue-700",
    pending: "bg-gray-100 text-gray-600",
    failed: "bg-red-100 text-red-700",
  };
  const label = status === "processing" || status === "pending" ? `${status}…` : status;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? "bg-gray-100"}`}>
      {label}
    </span>
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
          <Link href="/dashboard/chat" className="text-gray-600 hover:text-brand">Test Chat</Link>
          <span className="font-semibold text-brand">Knowledge</span>
        </nav>
      </div>
    </header>
  );
}

// Pull the Clerk token for multipart uploads (FormData can't go through the JSON api()).
async function getClerkToken(): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;
  const w = window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } };
  return (await w.Clerk?.session?.getToken()) ?? null;
}
