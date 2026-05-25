import { SignIn } from "@clerk/nextjs";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignInPage() {
  if (!clerkConfigured) {
    return <AuthPlaceholder action="Sign in" />;
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn />
    </div>
  );
}

function AuthPlaceholder({ action }: { action: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">{action} (demo mode)</h1>
        <p className="text-gray-600">
          Clerk is not configured yet. Add{" "}
          <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>{" "}
          to <code>frontend/.env.local</code> to enable real authentication.
        </p>
        <a href="/" className="mt-6 inline-block text-brand">← Back to home</a>
      </div>
    </div>
  );
}
