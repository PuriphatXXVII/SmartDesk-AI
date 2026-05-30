import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Bot } from "lucide-react";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 text-slate-100">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[130px]"
      />
      <Link href="/" className="relative z-10 mb-8 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
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

export default function SignUpPage() {
  if (!clerkConfigured) {
    return (
      <AuthShell>
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur">
          <h1 className="mb-2 text-2xl font-bold">Sign up (demo mode)</h1>
          <p className="text-sm text-slate-400">
            Clerk is not configured yet. Add{" "}
            <code className="rounded bg-white/10 px-1 text-slate-200">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>{" "}
            to <code className="text-slate-200">frontend/.env.local</code> to enable real authentication.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm text-indigo-400 transition hover:text-indigo-300">
            ← Back to home
          </Link>
        </div>
      </AuthShell>
    );
  }
  return (
    <AuthShell>
      <SignUp />
    </AuthShell>
  );
}
