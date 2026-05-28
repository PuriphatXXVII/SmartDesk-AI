"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

import { api } from "@/lib/api";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** Returns an authed fetch bound to the current Clerk session token. */
export function useApi() {
  const { getToken } = useAuth();
  return useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const token = clerkConfigured ? await getToken() : null;
      return api<T>(path, { token, init });
    },
    [getToken],
  );
}
