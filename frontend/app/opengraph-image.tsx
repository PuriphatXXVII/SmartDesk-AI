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
          background:
            "linear-gradient(135deg, #1e40af 0%, #3b82f6 60%, #60a5fa 100%)",
          padding: "80px",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 36, marginBottom: 32, opacity: 0.9 }}>
          <span style={{ fontSize: 64, marginRight: 16 }}>🤖</span>
          <span style={{ fontWeight: 700 }}>SmartDesk AI</span>
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, marginBottom: 24 }}>
          Turn your docs into
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, marginBottom: 40, color: "#fde047" }}>
          a 24/7 AI support agent
        </div>
        <div style={{ fontSize: 32, opacity: 0.9, lineHeight: 1.4, maxWidth: 900 }}>
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
