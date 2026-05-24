import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <div className="text-xl font-bold">
            🤖 SmartDesk <span className="text-brand">AI</span>
          </div>
          <nav className="flex gap-6 text-sm">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <Link href="/dashboard" className="font-semibold text-brand">
              Dashboard →
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
          Turn your docs into a{" "}
          <span className="text-brand">24/7 AI support agent</span>
        </h1>
        <p className="mb-10 max-w-2xl text-xl text-gray-600">
          Upload your knowledge base. Embed one line of code. Let SmartDesk AI
          handle 80% of customer questions — accurately and instantly.
        </p>
        <div className="flex gap-4">
          <Link
            href="/sign-up"
            className="rounded-lg bg-brand px-8 py-4 font-semibold text-white hover:bg-brand-dark"
          >
            Start Free
          </Link>
          <a
            href="#demo"
            className="rounded-lg border border-gray-300 px-8 py-4 font-semibold hover:bg-gray-50"
          >
            See Live Demo
          </a>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-gray-500">
        © 2026 SmartDesk AI · Built with Next.js, FastAPI & Claude
      </footer>
    </main>
  );
}
