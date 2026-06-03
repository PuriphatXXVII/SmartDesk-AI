import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SmartDesk AI — AI-Powered Customer Support";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#0b0b0c",
          padding: "80px",
          color: "#f4f4f6",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 36, marginBottom: 32 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              marginRight: 18,
              borderRadius: 12,
              background: "#e5484d",
              color: "white",
              fontWeight: 800,
            }}
          >
            S
          </span>
          <span style={{ fontWeight: 700 }}>
            SmartDesk <span style={{ color: "#f1555a" }}>AI</span>
          </span>
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, marginBottom: 24 }}>
          Turn your docs into
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, marginBottom: 40, color: "#f1555a" }}>
          a 24/7 AI support agent
        </div>
        <div style={{ fontSize: 32, color: "#a0a0a8", lineHeight: 1.4, maxWidth: 900 }}>
          RAG-powered · Multi-tenant SaaS · Next.js 16 + FastAPI + Claude
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 60,
            right: 80,
            fontSize: 24,
            opacity: 0.85,
            padding: "12px 24px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: 999,
          }}
        >
          smart-desk-ai-blush.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
