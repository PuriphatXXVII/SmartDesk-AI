"use client";

import { useEffect } from "react";

/**
 * Injects the SmartDesk widget <script> tag exactly the way a real customer
 * would. The widget itself (vanilla TS, served from /smartdesk.js) reads
 * data-widget-key + data-api-url from its script element and takes over.
 *
 * Renders nothing in the DOM tree — the widget paints its own floating bubble.
 * Skipped silently if no widget key is configured.
 */
export function WidgetEmbed({
  widgetKey,
  apiUrl,
}: {
  widgetKey: string;
  apiUrl: string;
}) {
  useEffect(() => {
    if (!widgetKey) return;
    const w = window as unknown as { __smartdeskCancelled?: boolean; __smartdeskDestroy?: () => void };
    w.__smartdeskCancelled = false;

    if (!document.getElementById("smartdesk-widget-script")) {
      const s = document.createElement("script");
      s.id = "smartdesk-widget-script";
      s.src = "/smartdesk.js";
      s.defer = true;
      s.setAttribute("data-widget-key", widgetKey);
      s.setAttribute("data-api-url", apiUrl);
      document.body.appendChild(s);
    }

    // The widget paints into <body>, outside React. On unmount: cancel any in-flight
    // init (race-safe), tear down the painted DOM + styles, and drop the script so
    // it re-runs cleanly when we return — keeping it confined to the landing page.
    return () => {
      w.__smartdeskCancelled = true;
      w.__smartdeskDestroy?.();
      document.getElementById("smartdesk-widget-script")?.remove();
    };
  }, [widgetKey, apiUrl]);

  return null;
}
