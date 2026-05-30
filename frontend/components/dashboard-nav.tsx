"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot } from "lucide-react";

import { AccountInfo } from "@/components/account-info";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/chat", label: "Test Chat" },
  { href: "/dashboard/knowledge", label: "Knowledge" },
  { href: "/dashboard/widget", label: "Widget" },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
            <Bot className="h-4 w-4 text-white" strokeWidth={2.2} />
          </span>
          <span className="font-semibold tracking-tight text-slate-100">
            SmartDesk <span className="text-gradient">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active =
              l.href === "/dashboard" ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-white/10 font-medium text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <AccountInfo />
      </div>
    </header>
  );
}
