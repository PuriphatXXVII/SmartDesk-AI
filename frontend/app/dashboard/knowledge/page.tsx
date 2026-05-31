"use client";

import Link from "next/link";
import { ArrowRight, FileText, Trash2, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { DashboardNav } from "@/components/dashboard-nav";
import { useI18n, type Messages } from "@/lib/i18n";
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
  const { t } = useI18n();
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
    // Load documents once on mount (the setState lives inside `refresh`).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  // Poll while any doc is still processing.
  useEffect(() => {
    if (!docs.some((d) => d.status === "pending" || d.status === "processing")) return;
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
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
    <div className="min-h-screen bg-bg text-fg">
      <DashboardNav />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.knowledge.title}</h1>
            <p className="mt-1 text-sm text-muted">{t.knowledge.subtitle}</p>
          </div>
          <Link
            href="/dashboard/chat"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold transition hover:bg-surface-2"
          >
            {t.knowledge.testAI} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-surface p-12 text-center transition ${
            uploading ? "opacity-60" : "hover:border-indigo-400/50 hover:bg-surface-2"
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
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-500/15 text-brand-fg">
            <UploadCloud className="h-7 w-7" />
          </span>
          <div className="mt-3 font-semibold">
            {uploading ? t.knowledge.uploading : t.knowledge.clickUpload}
          </div>
          <div className="mt-1 text-sm text-subtle">{t.knowledge.formats}</div>
        </label>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">
            {t.knowledge.documents} ({docs.length})
          </h2>
          {docs.length === 0 ? (
            <p className="rounded-2xl border border-line bg-surface p-8 text-center text-subtle">
              {t.knowledge.empty}
            </p>
          ) : (
            <div className="space-y-2">
              {docs.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4"
                >
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-indigo-500/15 text-brand-fg">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{d.title ?? t.knowledge.untitled}</div>
                    <div className="text-xs text-subtle">
                      {d.source_type} · {d.chunk_count} {t.knowledge.chunks}
                    </div>
                  </div>
                  <StatusBadge status={d.status} t={t} />
                  <button
                    onClick={() => remove(d.id)}
                    className="rounded-lg p-2 text-subtle transition hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400"
                    title={t.knowledge.delete}
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

function StatusBadge({ status, t }: { status: string; t: Messages }) {
  const styles: Record<string, string> = {
    ready: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    processing: "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
    pending: "bg-surface-2 text-muted",
    failed: "bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  };
  const labels: Record<string, string> = {
    ready: t.knowledge.statusReady,
    processing: t.knowledge.statusProcessing,
    pending: t.knowledge.statusPending,
    failed: t.knowledge.statusFailed,
  };
  const label = status === "processing" || status === "pending" ? `${labels[status]}…` : labels[status] ?? status;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] ?? "bg-surface-2 text-muted"}`}>
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
