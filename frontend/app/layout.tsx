import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartDesk AI — AI-Powered Customer Support",
  description:
    "Turn your documentation into a 24/7 intelligent support agent in minutes.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
};

// Wrap with ClerkProvider only when Clerk is configured.
// Lets `npm run dev` work out of the box without signing up for Clerk first.
const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const body = (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );

  return clerkConfigured ? <ClerkProvider>{body}</ClerkProvider> : body;
}
