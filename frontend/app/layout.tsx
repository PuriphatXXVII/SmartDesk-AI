import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Providers } from "@/components/providers";

// Runs before paint: applies the saved theme (default dark) + language to <html>
// so there's no light/dark flash and the lang attribute is correct on first paint.
const initScript = `(function(){try{var t=localStorage.getItem('theme')||'dark';if(t==='dark'){document.documentElement.classList.add('dark');}var l=localStorage.getItem('lang')||'en';document.documentElement.setAttribute('lang',l);}catch(e){}})();`;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SmartDesk AI — AI-Powered Customer Support",
    template: "%s · SmartDesk AI",
  },
  description:
    "Turn your documentation into a 24/7 AI support agent. RAG-powered, multi-tenant SaaS built with Next.js 16, FastAPI, and Claude.",
  keywords: [
    "AI customer support",
    "RAG chatbot",
    "knowledge base AI",
    "embeddable chat widget",
    "Anthropic Claude",
    "Next.js SaaS",
  ],
  authors: [{ name: "Puriphat Srikamnoi", url: "https://github.com/PuriphatXXVII" }],
  creator: "Puriphat Srikamnoi",
  openGraph: {
    type: "website",
    siteName: "SmartDesk AI",
    title: "SmartDesk AI — AI-Powered Customer Support",
    description:
      "Turn your documentation into a 24/7 AI support agent. RAG-powered, multi-tenant SaaS.",
    url: siteUrl,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartDesk AI — AI-Powered Customer Support",
    description:
      "Turn your documentation into a 24/7 AI support agent. RAG-powered, multi-tenant SaaS.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const body = (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );

  return clerkConfigured ? (
    <ClerkProvider afterSignOutUrl="/">{body}</ClerkProvider>
  ) : (
    body
  );
}
