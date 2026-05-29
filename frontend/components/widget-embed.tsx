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
    if (document.getElementById("smartdesk-widget-script")) return;

    const s = document.createElement("script");
    s.id = "smartdesk-widget-script";
    s.src = "/smartdesk.js";
    s.defer = true;
    s.setAttribute("data-widget-key", widgetKey);
    s.setAttribute("data-api-url", apiUrl);
    document.body.appendChild(s);
  }, [widgetKey, apiUrl]);

  return null;
}
