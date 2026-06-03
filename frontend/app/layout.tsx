import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Anuphan, Fredoka, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/providers";

// Type system: a rounded display (Fredoka — soft, big-presence headings), a clean
// grotesk for body/UI, mono for code & labels, plus a Thai face for TH fallback.
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-face",
  display: "swap",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jbmono",
  display: "swap",
});
const anuphan = Anuphan({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-thai",
  display: "swap",
});

const fontVars = `${fredoka.variable} ${hanken.variable} ${jetbrains.variable} ${anuphan.variable}`;

// Runs before paint: applies the saved theme (default light) + language to <html>
// so there's no flash and the lang attribute is correct on first paint.
const initScript = `(function(){try{var t=localStorage.getItem('theme')||'light';if(t==='dark'){document.documentElement.classList.add('dark');}var l=localStorage.getItem('lang')||'en';document.documentElement.setAttribute('lang',l);}catch(e){}})();`;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SmartDesk AI",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
  width: "device-width",
  initialScale: 1,
};

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const body = (
    <html lang="en" className={fontVars} suppressHydrationWarning>
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
