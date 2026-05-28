const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface MeResponse {
  user: { id: string; email: string; role: string; clerk_user_id: string };
  organization: { id: string; name: string; slug: string; plan: string };
}

/**
 * Fetch wrapper that targets the FastAPI backend. Pass a Clerk session token
 * to authenticate (get it client-side via useAuth().getToken()).
 */
export async function api<T>(
  path: string,
  opts: { token?: string | null; init?: RequestInit } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.init?.headers as Record<string, string>) ?? {}),
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(`${API_URL}${path}`, { ...opts.init, headers });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}
