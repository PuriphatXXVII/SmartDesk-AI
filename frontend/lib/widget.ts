// Where the embeddable widget script is served from.
//
// The widget bundle ships from the deployed frontend at `<origin>/smartdesk.js`,
// so in production set NEXT_PUBLIC_SITE_URL to that origin. NEXT_PUBLIC_WIDGET_SRC
// can override it outright (e.g. a dedicated CDN). Locally it falls back to the
// dev server. This must be an absolute URL — the snippet is pasted onto other sites.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const WIDGET_SRC = process.env.NEXT_PUBLIC_WIDGET_SRC ?? `${SITE_URL}/smartdesk.js`;
