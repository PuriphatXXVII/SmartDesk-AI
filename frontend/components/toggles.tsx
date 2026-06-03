"use client";

import { Moon, Sun } from "lucide-react";

import { useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  return (
    <button
      onClick={toggle}
      aria-label={t.common.theme}
      title={t.common.theme}
      className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-muted transition hover:text-fg"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function LangToggle() {
  const { lang, setLang } = useI18n();
  const opts: { code: Lang; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "th", label: "ไทย" },
  ];
  return (
    <div className="flex items-center rounded-lg border border-line bg-surface p-0.5 text-xs font-semibold">
      {opts.map((o) => (
        <button
          key={o.code}
          onClick={() => setLang(o.code)}
          className={`rounded-md px-2 py-1 transition ${
            lang === o.code ? "bg-fg text-bg" : "text-muted hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
