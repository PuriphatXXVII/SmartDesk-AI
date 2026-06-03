"use client";

import { Check, Copy, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { DashboardNav } from "@/components/dashboard-nav";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { WIDGET_SRC } from "@/lib/widget";

interface Settings {
  widget_key: string;
  primary_color: string;
  position: "bottom-right" | "bottom-left";
  welcome_message: string;
  persona_prompt: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const CARD = "card p-6";
const INPUT =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-fg placeholder:text-subtle outline-none transition focus:border-accent";

export default function WidgetPage() {
  const callApi = useApi();
  const { t } = useI18n();
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setS(await callApi<Settings>("/api/widget/settings"));
  }, [callApi]);

  useEffect(() => {
    // Load settings once on mount (the setState lives inside `load`).
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  src="${WIDGET_SRC}"
  data-widget-key="${s.widget_key}"
  data-api-url="${API_URL}"
  defer
></script>`
    : "";

  return (
    <div className="min-h-screen bg-bg text-fg">
      <DashboardNav />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-1 font-display text-3xl font-semibold tracking-tight">{t.widget.title}</h1>
        <p className="mb-6 text-sm text-muted">{t.widget.subtitle}</p>

        {!s ? (
          <p className="text-subtle">{t.widget.loading}</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* --- Settings --- */}
            <div className={`space-y-5 ${CARD}`}>
              <Field label={t.widget.primaryColor}>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={s.primary_color}
                    onChange={(e) => setS({ ...s, primary_color: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-transparent"
                  />
                  <span className="font-mono text-sm text-muted">{s.primary_color}</span>
                </div>
              </Field>

              <Field label={t.widget.position}>
                <select
                  value={s.position}
                  onChange={(e) => setS({ ...s, position: e.target.value as Settings["position"] })}
                  className={INPUT}
                >
                  <option value="bottom-right">{t.widget.bottomRight}</option>
                  <option value="bottom-left">{t.widget.bottomLeft}</option>
                </select>
              </Field>

              <Field label={t.widget.welcome}>
                <input
                  value={s.welcome_message}
                  onChange={(e) => setS({ ...s, welcome_message: e.target.value })}
                  className={INPUT}
                  maxLength={200}
                />
              </Field>

              <Field label={t.widget.persona}>
                <textarea
                  value={s.persona_prompt ?? ""}
                  onChange={(e) => setS({ ...s, persona_prompt: e.target.value })}
                  className={`${INPUT} h-24 text-sm`}
                  placeholder={t.widget.personaPlaceholder}
                  maxLength={1000}
                />
              </Field>

              <div className="flex items-center gap-3">
                <button
                  onClick={save}
                  disabled={saving}
                  className="btn btn-accent disabled:opacity-50"
                >
                  {saving ? t.widget.saving : t.widget.save}
                </button>
                {saved && (
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                    <Check className="h-4 w-4" /> {t.widget.saved}
                  </span>
                )}
              </div>
            </div>

            {/* --- Preview + snippet --- */}
            <div className="space-y-6">
              <div className={CARD}>
                <h2 className="mb-3 text-lg font-semibold">{t.widget.livePreview}</h2>
                <WidgetPreview
                  color={s.primary_color}
                  welcome={s.welcome_message}
                  support={t.widget.support}
                  type={t.widget.type}
                  send={t.widget.send}
                />
              </div>

              <div className={CARD}>
                <h2 className="mb-1 text-lg font-semibold">{t.widget.install}</h2>
                <p className="mb-3 text-sm text-muted">{t.widget.pasteBefore}</p>
                <pre className="overflow-x-auto rounded-lg border border-line bg-surface-2 p-3 font-mono text-xs leading-relaxed text-fg">
                  {snippet}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(snippet);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="btn btn-outline mt-3 w-full"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-accent-fg" /> {t.widget.copied}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> {t.widget.copy}
                    </>
                  )}
                </button>
                <p className="mt-3 break-all text-xs text-subtle">{t.widget.widgetKey} {s.widget_key}</p>
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
      <label className="mb-1.5 block text-sm font-medium text-muted">{label}</label>
      {children}
    </div>
  );
}

function WidgetPreview({
  color,
  welcome,
  support,
  type,
  send,
}: {
  color: string;
  welcome: string;
  support: string;
  type: string;
  send: string;
}) {
  return (
    <div className="relative h-72 overflow-hidden rounded-lg border border-line bg-fg">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid" style={{ opacity: 0.4 }} />
      <div className="absolute bottom-3 right-3 w-56 overflow-hidden rounded-xl border border-black/5 bg-white text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between p-2.5 text-white" style={{ background: color }}>
          <span className="text-xs font-semibold">{support}</span>
          <span className="text-xs">✕</span>
        </div>
        <div className="space-y-2 p-3">
          <div className="max-w-[85%] rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs">{welcome}</div>
        </div>
        <div className="border-t border-slate-100 p-2">
          <div className="flex gap-1">
            <div className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs text-slate-400">{type}</div>
            <div className="rounded px-2 py-1 text-xs text-white" style={{ background: color }}>
              {send}
            </div>
          </div>
        </div>
      </div>
      <div
        className="absolute bottom-3 right-3 grid h-12 w-12 place-items-center rounded-full text-white shadow-lg"
        style={{ background: color, display: "none" }}
      >
        <MessageSquare className="h-5 w-5" />
      </div>
    </div>
  );
}
