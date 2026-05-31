"use client";

import { Check, Webhook } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { DashboardNav } from "@/components/dashboard-nav";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";

interface OrgSettings {
  plan: string;
  webhook_url: string | null;
  webhook_secret_set: boolean;
}

const CARD = "rounded-2xl border border-line bg-surface p-6";
const INPUT =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-fg placeholder:text-subtle outline-none transition focus:border-indigo-400/60";

const EVENTS = ["conversation.started", "message.low_confidence", "conversation.handoff"];

export default function SettingsPage() {
  const { t } = useI18n();
  const callApi = useApi();
  const [data, setData] = useState<OrgSettings | null>(null);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const s = await callApi<OrgSettings>("/api/settings");
    setData(s);
    setUrl(s.webhook_url ?? "");
  }, [callApi]);

  useEffect(() => {
    // Load settings once on mount (the setState lives inside `load`).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch(() => undefined);
  }, [load]);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const body: Record<string, string> = { webhook_url: url };
      if (secret) body.webhook_secret = secret; // omit to keep current
      const s = await callApi<OrgSettings>("/api/settings", { method: "PUT", body: JSON.stringify(body) });
      setData(s);
      setSecret("");
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <DashboardNav />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight">{t.settings.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.settings.subtitle}</p>

        {!data ? (
          <p className="mt-8 text-subtle">{t.widget.loading}</p>
        ) : (
          <div className="mt-6 space-y-6">
            <div className={`flex items-center justify-between ${CARD}`}>
              <span className="text-sm text-muted">{t.settings.plan}</span>
              <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-sm font-semibold capitalize text-brand-fg">
                {data.plan}
              </span>
            </div>

            <div className={`space-y-5 ${CARD}`}>
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-500/15 text-brand-fg">
                  <Webhook className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-semibold">Webhooks</h2>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-muted">{t.settings.webhookUrl}</span>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t.settings.webhookUrlPlaceholder}
                  className={INPUT}
                  type="url"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-muted">{t.settings.webhookSecret}</span>
                <input
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder={data.webhook_secret_set ? "••••••••" : t.settings.webhookSecretPlaceholder}
                  className={INPUT}
                  type="password"
                />
                {data.webhook_secret_set && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> {t.settings.secretSet}
                  </span>
                )}
              </label>

              <div className="rounded-xl border border-line bg-surface-2 p-4">
                <div className="text-sm font-medium">{t.settings.events}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {EVENTS.map((e) => (
                    <code key={e} className="rounded-md bg-indigo-500/10 px-2 py-1 text-xs text-brand-fg">
                      {e}
                    </code>
                  ))}
                </div>
                <p className="mt-3 text-xs text-subtle">{t.settings.hint}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50 disabled:opacity-50"
                >
                  {saving ? "…" : t.settings.save}
                </button>
                {saved && (
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                    <Check className="h-4 w-4" /> {t.settings.saved}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
