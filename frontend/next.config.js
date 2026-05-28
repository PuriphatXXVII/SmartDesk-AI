/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

// Clerk loads its JS from *.clerk.accounts.dev and bot-protection (Cloudflare
// Turnstile) from challenges.cloudflare.com — both must be allowed by the CSP.
const CLERK_SCRIPT = "https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com";

// React dev mode + Next.js HMR need eval(). Strip this in production.
const scriptSrc = isProd
  ? `script-src 'self' 'unsafe-inline' ${CLERK_SCRIPT}`
  : `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${CLERK_SCRIPT}`;

const csp = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "frame-src https://challenges.cloudflare.com https://*.clerk.accounts.dev",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com " +
    (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") +
    " " +
    (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000"),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  isProd ? "upgrade-insecure-requests" : "",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // typedRoutes disabled at MVP — re-enable once all routes are stable
  // (currently catch-all auth routes /sign-in[[...]], /sign-up[[...]] confuse type generation)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
