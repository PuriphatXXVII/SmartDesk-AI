"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { api, type MeResponse } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function AccountInfo() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { t } = useI18n();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // In dev (no Clerk) the backend accepts unauthenticated calls and
        // returns a synthetic dev user, so we still call /me.
        const token = clerkConfigured && isSignedIn ? await getToken() : null;
        const data = await api<MeResponse>("/api/auth/me", { token });
        if (!cancelled) setMe(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "failed to load");
      }
    }
    if (!clerkConfigured || isLoaded) load();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        {me ? (
          <>
            <div className="text-sm font-semibold text-fg">{me.organization.name}</div>
            <div className="text-xs text-muted">
              {me.user.email} · {me.organization.plan}
            </div>
          </>
        ) : error ? (
          <div className="text-xs text-red-500 dark:text-red-400" title={error}>
            {t.account.offline}
          </div>
        ) : (
          <div className="text-xs text-subtle">{t.account.loading}</div>
        )}
      </div>
      {clerkConfigured ? (
        <UserButton />
      ) : (
        <div className="h-8 w-8 rounded-full bg-linear-to-br from-indigo-500 to-violet-500" />
      )}
    </div>
  );
}
