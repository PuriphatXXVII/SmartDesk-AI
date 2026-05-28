"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { api, type MeResponse } from "@/lib/api";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function AccountInfo() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
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
      <div className="text-right">
        {me ? (
          <>
            <div className="text-sm font-semibold">{me.organization.name}</div>
            <div className="text-xs text-gray-500">
              {me.user.email} · {me.organization.plan}
            </div>
          </>
        ) : error ? (
          <div className="text-xs text-red-500" title={error}>
            backend offline
          </div>
        ) : (
          <div className="text-xs text-gray-400">loading…</div>
        )}
      </div>
      {clerkConfigured ? (
        <UserButton />
      ) : (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand to-purple-500" />
      )}
    </div>
  );
}
