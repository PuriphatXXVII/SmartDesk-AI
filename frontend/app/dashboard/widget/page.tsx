"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useApi } from "@/lib/use-api";

interface Settings {
  widget_key: string;
  primary_color: string;
  position: "bottom-right" | "bottom-left";
  welcome_message: string;
  persona_prompt: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function WidgetPage() {
  const callApi = useApi();
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setS(await callApi<Settings>("/api/widget/settings"));
  }, [callApi]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  async function save() {
    if (!s) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await callApi<Settings>("/api/widget/settings", {
        method: "PUT",
        body: JSON.stringify({
          primary_color: s.primary_color,
          position: s.position,
          welcome_message: s.welcome_message,
          persona_prompt: s.persona_prompt,
        }),
      });
      setS(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const snippet = s
    ? `<script
  src="https://cdn.smartdesk.ai/smartdesk.js"
  data-widget-key="${s.widget_key}"
  data-api-url="${API_URL}"
  defer
></script>`
    : "";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-1 text-3xl font-bold">Widget</h1>
        <p className="mb-6 text-gray-500">Customize your embeddable chat widget and grab the install snippet.</p>

        {!s ? (
          <p className="text-gray-400">loading…</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* --- Settings --- */}
            <div className="space-y-5 rounded-xl border bg-white p-6">
              <Field label="Primary color">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={s.primary_color}
                    onChange={(e) => setS({ ...s, primary_color: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded border"
                  />
                  <span className="font-mono text-sm">{s.primary_color}</span>
                </div>
              </Field>

              <Field label="Position">
                <select
                  value={s.position}
                  onChange={(e) => setS({ ...s, position: e.target.value as Settings["position"] })}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  <option value="bottom-right">Bottom right</option>
                  <option value="bottom-left">Bottom left</option>
                </select>
              </Field>

              <Field label="Welcome message">
                <input
                  value={s.welcome_message}
                  onChange={(e) => setS({ ...s, welcome_message: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  maxLength={200}
                />
              </Field>

              <Field label="Persona prompt (optional)">
                <textarea
                  value={s.persona_prompt ?? ""}
                  onChange={(e) => setS({ ...s, persona_prompt: e.target.value })}
                  className="h-24 w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="e.g. Friendly, concise, replies in the customer's language."
                  maxLength={1000}
                />
              </Field>

              <button
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              {saved && <span className="ml-3 text-sm text-green-600">✓ Saved</span>}
            </div>

            {/* --- Preview + snippet --- */}
            <div className="space-y-6">
              <div className="rounded-xl border bg-white p-6">
                <h2 className="mb-3 text-lg font-bold">Live preview</h2>
                <WidgetPreview color={s.primary_color} welcome={s.welcome_message} />
              </div>

              <div className="rounded-xl border bg-white p-6">
                <h2 className="mb-1 text-lg font-bold">Install snippet</h2>
                <p className="mb-3 text-sm text-gray-500">Paste before &lt;/body&gt; on your site.</p>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-green-400">{snippet}</pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(snippet);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="mt-3 w-full rounded-lg bg-gray-100 py-2 text-sm font-semibold hover:bg-gray-200"
                >
                  {copied ? "✓ Copied!" : "Copy snippet"}
                </button>
                <p className="mt-3 break-all text-xs text-gray-400">widget key: {s.widget_key}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function WidgetPreview({ color, welcome }: { color: string; welcome: string }) {
  return (
    <div className="relative h-72 overflow-hidden rounded-lg border bg-gray-100">
      <div className="absolute bottom-3 right-3 w-56 overflow-hidden rounded-xl border bg-white shadow-lg">
        <div className="flex items-center justify-between p-2 text-white" style={{ background: color }}>
          <span className="text-xs font-semibold">Support</span>
          <span className="text-xs">✕</span>
        </div>
        <div className="space-y-2 p-3">
          <div className="max-w-[85%] rounded-lg border bg-white px-2 py-1 text-xs">{welcome}</div>
        </div>
        <div className="border-t p-2">
          <div className="flex gap-1">
            <div className="flex-1 rounded border px-2 py-1 text-xs text-gray-400">Type…</div>
            <div className="rounded px-2 py-1 text-xs text-white" style={{ background: color }}>Send</div>
          </div>
        </div>
      </div>
      <div
        className="absolute bottom-3 right-3 flex h-12 w-12 translate-y-0 items-center justify-center rounded-full text-xl text-white shadow-lg"
        style={{ background: color, right: "0.75rem", bottom: "0.75rem", display: "none" }}
      >
        💬
      </div>
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
          <Link href="/dashboard/chat" className="text-gray-600 hover:text-brand">Test Chat</Link>
          <Link href="/dashboard/knowledge" className="text-gray-600 hover:text-brand">Knowledge</Link>
          <span className="font-semibold text-brand">Widget</span>
        </nav>
      </div>
    </header>
  );
}
