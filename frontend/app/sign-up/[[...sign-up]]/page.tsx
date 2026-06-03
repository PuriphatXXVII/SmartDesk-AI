"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Bot } from "lucide-react";

import { LangToggle, ThemeToggle } from "@/components/toggles";
import { useI18n } from "@/lib/i18n";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-4 text-fg">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade" />
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <LangToggle />
        <ThemeToggle />
      </div>
      <Link href="/" className="relative z-10 mb-8 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-[7px] bg-accent text-white">
          <Bot className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">
          SmartDesk <span className="text-accent-fg">AI</span>
        </span>
      </Link>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function SignUpPage() {
  const { t } = useI18n();
  if (!clerkConfigured) {
    return (
      <AuthShell>
        <div className="card max-w-md p-8 text-center">
          <h1 className="mb-2 text-2xl font-bold">{t.auth.signUpDemo}</h1>
          <p className="text-sm text-muted">
            {t.auth.notConfigured}{" "}
            <code className="rounded bg-surface-2 px-1 text-fg">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>{" "}
            <code className="text-fg">frontend/.env.local</code> {t.auth.toEnable}
          </p>
          <Link href="/" className="link-accent mt-6 inline-block text-sm">
            {t.auth.backHome}
          </Link>
        </div>
      </AuthShell>
    );
  }
  return (
    <AuthShell>
      <SignUp appearance={{ variables: { colorPrimary: "#e5484d", borderRadius: "0.45rem" } }} />
    </AuthShell>
  );
}
