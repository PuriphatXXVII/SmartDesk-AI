"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Bot } from "lucide-react";

import { LangToggle, ThemeToggle } from "@/components/toggles";
import { useI18n } from "@/lib/i18n";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-4 text-fg">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-105 w-170 -translate-x-1/2 rounded-full bg-indigo-600/25 blur-[130px]"
      />
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <LangToggle />
        <ThemeToggle />
      </div>
      <Link href="/" className="relative z-10 mb-8 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
          <Bot className="h-5 w-5 text-white" strokeWidth={2.2} />
        </span>
        <span className="text-lg font-semibold tracking-tight">
          SmartDesk <span className="text-gradient">AI</span>
        </span>
      </Link>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function SignInPage() {
  const { t } = useI18n();
  if (!clerkConfigured) {
    return (
      <AuthShell>
        <div className="max-w-md rounded-2xl border border-line bg-surface p-8 text-center backdrop-blur">
          <h1 className="mb-2 text-2xl font-bold">{t.auth.signInDemo}</h1>
          <p className="text-sm text-muted">
            {t.auth.notConfigured}{" "}
            <code className="rounded bg-surface-2 px-1 text-fg">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>{" "}
            <code className="text-fg">frontend/.env.local</code> {t.auth.toEnable}
          </p>
          <Link href="/" className="mt-6 inline-block text-sm text-brand-fg transition hover:opacity-80">
            {t.auth.backHome}
          </Link>
        </div>
      </AuthShell>
    );
  }
  return (
    <AuthShell>
      <SignIn />
    </AuthShell>
  );
}
