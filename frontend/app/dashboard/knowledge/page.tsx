"use client";

import Link from "next/link";
import { ArrowRight, FileText, Trash2, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { DashboardNav } from "@/components/dashboard-nav";
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <DashboardNav />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Knowledge base</h1>
            <p className="mt-1 text-sm text-slate-400">
              Upload docs — they’re parsed, chunked &amp; embedded for your AI.
            </p>
          </div>
          <Link
            href="/dashboard/chat"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
          >
            Test your AI <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-12 text-center transition ${
            uploading ? "opacity-60" : "hover:border-indigo-400/50 hover:bg-white/[0.04]"
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
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <UploadCloud className="h-7 w-7" />
          </span>
          <div className="mt-3 font-semibold">
            {uploading ? "Uploading…" : "Click to upload a document"}
          </div>
          <div className="mt-1 text-sm text-slate-500">PDF, DOCX, TXT, MD, HTML · up to 25MB</div>
        </label>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Documents ({docs.length})</h2>
          {docs.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-500">
              No documents yet. Upload one above to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {docs.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-indigo-500/15 text-indigo-300">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{d.title ?? "Untitled"}</div>
                    <div className="text-xs text-slate-500">
                      {d.source_type} · {d.chunk_count} chunks
                    </div>
                  </div>
                  <StatusBadge status={d.status} />
                  <button
                    onClick={() => remove(d.id)}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
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
    ready: "bg-emerald-500/15 text-emerald-300",
    processing: "bg-indigo-500/15 text-indigo-300",
    pending: "bg-white/10 text-slate-400",
    failed: "bg-red-500/15 text-red-300",
  };
  const label = status === "processing" || status === "pending" ? `${status}…` : status;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? "bg-white/10 text-slate-400"}`}>
      {label}
    </span>
  );
}

// Pull the Clerk token for multipart uploads (FormData can't go through the JSON api()).
async function getClerkToken(): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;
  const w = window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } };
  return (await w.Clerk?.session?.getToken()) ?? null;
}
