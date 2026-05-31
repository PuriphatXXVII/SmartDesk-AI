"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot } from "lucide-react";

import { AccountInfo } from "@/components/account-info";
import { LangToggle, ThemeToggle } from "@/components/toggles";
import { useI18n } from "@/lib/i18n";

export function DashboardNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const links = [
    { href: "/dashboard", label: t.nav.dashboard },
    { href: "/dashboard/conversations", label: t.nav.conversations },
    { href: "/dashboard/chat", label: t.nav.chat },
    { href: "/dashboard/knowledge", label: t.nav.knowledge },
    { href: "/dashboard/widget", label: t.nav.widget },
    { href: "/dashboard/settings", label: t.nav.settings },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
            <Bot className="h-4 w-4 text-white" strokeWidth={2.2} />
          </span>
          <span className="font-semibold tracking-tight">
            SmartDesk <span className="text-gradient">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active =
              l.href === "/dashboard" ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-surface-2 font-medium text-fg"
                    : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          <AccountInfo />
        </div>
      </div>
    </header>
  );
}
