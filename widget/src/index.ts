/**
 * SmartDesk AI — embeddable chat widget (vanilla TS, no deps).
 *
 * Install:
 *   <script src="https://cdn.smartdesk.ai/smartdesk.js"
 *           data-widget-key="wk_xxx"
 *           data-api-url="https://api.smartdesk.ai"
 *           defer></script>
 *
 * Fetches appearance from /api/widget/config?key=..., streams answers over
 * /api/chat/ws?key=... (RAG, grounded), renders markdown, shows a typing
 * indicator, receives live human-agent replies, and remembers the conversation
 * for this browser tab (sessionStorage) so reopening continues the same thread.
 */

interface WidgetConfig {
  organization?: string;
  primary_color: string;
  position: "bottom-right" | "bottom-left";
  welcome_message: string;
}

interface Citation {
  title: string | null;
  score: number;
  snippet: string;
}

type Role = "user" | "bot" | "agent";
interface Msg {
  role: Role;
  content: string;
}

const script = document.currentScript as HTMLScriptElement | null;
const WIDGET_KEY = script?.dataset.widgetKey ?? "";
const API_URL = (script?.dataset.apiUrl ?? "http://localhost:8000").replace(/\/$/, "");
const WS_URL = script?.dataset.wsUrl ?? API_URL.replace(/^http/, "ws");
const STORE_KEY = `smartdesk:${WIDGET_KEY}`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Minimal, safe markdown → HTML (escape first, then a small subset). */
function md(raw: string): string {
  let s = escapeHtml(raw);
  s = s.replace(/^#{1,6}\s+/gm, ""); // strip heading hashes
  s = s.replace(/^[ \t]*[-*]\s+/gm, "• "); // bullets
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  s = s.replace(/\n/g, "<br>");
  return s;
}

class SmartDeskWidget {
  private cfg: WidgetConfig = {
    primary_color: "#6366f1",
    position: "bottom-right",
    welcome_message: "Hi! How can I help you?",
  };
  private root!: HTMLDivElement;
  private ws: WebSocket | null = null;
  private streamingEl: HTMLDivElement | null = null;
  private streamingRaw = "";
  private typingEl: HTMLDivElement | null = null;
  private conversationId: string | null = null;
  private history: Msg[] = [];

  async init() {
    this.restore();
    await this.loadConfig();
    this.root = document.createElement("div");
    this.root.id = "smartdesk-widget";
    document.body.appendChild(this.root);
    this.injectStyles();
    this.renderClosed();
  }

  // --- persistence (per tab) ---
  private restore() {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        this.conversationId = typeof d.cid === "string" ? d.cid : null;
        this.history = Array.isArray(d.msgs) ? d.msgs : [];
      }
    } catch {
      /* ignore */
    }
  }
  private persist() {
    try {
      sessionStorage.setItem(
        STORE_KEY,
        JSON.stringify({ cid: this.conversationId, msgs: this.history.slice(-50) }),
      );
    } catch {
      /* ignore */
    }
  }

  private async loadConfig() {
    try {
      const res = await fetch(`${API_URL}/api/widget/config?key=${encodeURIComponent(WIDGET_KEY)}`);
      if (res.ok) this.cfg = { ...this.cfg, ...(await res.json()) };
    } catch {
      /* keep defaults if offline */
    }
  }

  private injectStyles() {
    const c = this.cfg.primary_color;
    const side = this.cfg.position === "bottom-left" ? "left: 20px;" : "right: 20px;";
    const style = document.createElement("style");
    style.textContent = `
      #smartdesk-widget{position:fixed;${side}bottom:20px;z-index:2147483000;font-family:system-ui,-apple-system,sans-serif}
      .sd-fab{width:60px;height:60px;border-radius:50%;background:${c};color:#fff;border:none;cursor:pointer;font-size:26px;box-shadow:0 6px 20px rgba(0,0,0,.18);transition:transform .15s}
      .sd-fab:hover{transform:scale(1.05)}
      .sd-panel{width:370px;max-width:calc(100vw - 40px);height:560px;max-height:calc(100vh - 40px);background:#fff;color:#0f172a;border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.22)}
      .sd-head{background:${c};color:#fff;padding:16px;display:flex;justify-content:space-between;align-items:center}
      .sd-head b{font-size:15px}
      .sd-head small{opacity:.85;font-size:12px;display:block}
      .sd-x{background:none;border:none;color:#fff;cursor:pointer;font-size:20px;line-height:1}
      .sd-msgs{flex:1;overflow-y:auto;padding:16px;background:#f8fafc}
      .sd-msg{padding:10px 14px;border-radius:14px;margin-bottom:10px;max-width:85%;font-size:14px;line-height:1.55;word-wrap:break-word}
      .sd-msg strong{font-weight:700}
      .sd-msg code{background:#e8edf3;padding:1px 5px;border-radius:5px;font-size:13px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
      .sd-bot{background:#fff;border:1px solid #e5e7eb;color:#0f172a}
      .sd-user{background:${c};color:#fff;margin-left:auto;white-space:pre-wrap}
      .sd-agent{background:#ecfdf5;border:1px solid #6ee7b7;color:#065f46}
      .sd-agent-label{font-size:11px;color:#059669;font-weight:600;margin:0 0 2px 4px}
      .sd-typing{display:inline-flex;gap:5px;padding:3px 0}
      .sd-typing span{width:7px;height:7px;border-radius:50%;background:#94a3b8;display:inline-block;animation:sd-bd 1.2s infinite ease-in-out}
      .sd-typing span:nth-child(2){animation-delay:.15s}
      .sd-typing span:nth-child(3){animation-delay:.3s}
      @keyframes sd-bd{0%,70%,100%{transform:scale(.65);opacity:.4}35%{transform:scale(1);opacity:1}}
      .sd-cite{font-size:11px;color:#64748b;margin:-4px 0 10px;padding-left:4px}
      .sd-conf{font-size:11px;color:#94a3b8;margin:-6px 0 10px;padding-left:4px}
      .sd-form{display:flex;gap:8px;border-top:1px solid #e5e7eb;padding:10px;background:#fff}
      .sd-form input{flex:1;border:1px solid #d1d5db;border-radius:10px;padding:10px 12px;outline:none;font-size:14px;color:#0f172a;background:#fff}
      .sd-form input::placeholder{color:#9ca3af;opacity:1}
      .sd-form input:focus{border-color:${c}}
      .sd-form button{background:${c};color:#fff;border:none;border-radius:10px;padding:0 16px;cursor:pointer;font-weight:600}
      .sd-form button:disabled{opacity:.5}
      .sd-foot{text-align:center;font-size:10px;color:#cbd5e1;padding:4px}
    `;
    document.head.appendChild(style);
  }

  private renderClosed() {
    this.ws?.close();
    this.ws = null;
    this.streamingEl = null;
    this.typingEl = null;
    this.root.innerHTML = `<button class="sd-fab" aria-label="Open chat">💬</button>`;
    this.root.querySelector(".sd-fab")!.addEventListener("click", () => this.openPanel());
  }

  private openPanel() {
    const title = this.cfg.organization ? `${this.cfg.organization} Support` : "Support";
    this.root.innerHTML = `
      <div class="sd-panel">
        <div class="sd-head"><div><b>${esc(title)}</b><small>● AI assistant</small></div><button class="sd-x" aria-label="Close">✕</button></div>
        <div class="sd-msgs"></div>
        <form class="sd-form"><input type="text" placeholder="Type your question..." autocomplete="off"/><button type="submit">Send</button></form>
        <div class="sd-foot">Powered by SmartDesk AI</div>
      </div>`;
    this.root.querySelector(".sd-x")!.addEventListener("click", () => this.renderClosed());
    this.root.querySelector(".sd-form")!.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = this.root.querySelector<HTMLInputElement>(".sd-form input")!;
      const v = input.value.trim();
      if (v) {
        this.send(v);
        input.value = "";
      }
    });

    // Replay this tab's history, or greet a fresh visitor.
    if (this.history.length) {
      for (const m of this.history) this.renderMsg(m.role, m.content);
    } else {
      this.append("sd-bot", this.cfg.welcome_message, true);
    }
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(`${WS_URL}/api/chat/ws?key=${encodeURIComponent(WIDGET_KEY)}`);
    this.ws.onmessage = (ev) => this.onEvent(JSON.parse(ev.data));
  }

  private send(text: string) {
    this.append("sd-user", text, false);
    this.history.push({ role: "user", content: text });
    this.persist();
    this.streamingEl = null;
    this.streamingRaw = "";
    this.showTyping();

    const payload: { content: string; conversation_id?: string } = { content: text };
    if (this.conversationId) payload.conversation_id = this.conversationId;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      this.hideTyping();
      this.append("sd-bot", "⚠️ Connection lost. Please reopen the chat.", false);
    }
  }

  private onEvent(e: {
    type: string;
    content?: string;
    citations?: Citation[];
    confidence?: number;
    conversation_id?: string;
  }) {
    if (e.type === "token" && e.content) {
      this.hideTyping();
      if (!this.streamingEl) {
        this.streamingEl = this.append("sd-bot", "", true);
        this.streamingRaw = "";
      }
      this.streamingRaw += e.content;
      this.streamingEl.innerHTML = md(this.streamingRaw);
      this.scroll();
    } else if (e.type === "citations") {
      this.hideTyping();
      if (typeof e.confidence === "number") this.addConfidence(e.confidence);
      (e.citations ?? []).forEach((c, i) => this.addCite(i + 1, c));
    } else if (e.type === "agent" && e.content) {
      this.hideTyping();
      this.streamingEl = null;
      this.renderMsg("agent", e.content);
      this.history.push({ role: "agent", content: e.content });
      this.persist();
    } else if (e.type === "session") {
      this.conversationId = e.conversation_id ?? this.conversationId;
      this.persist();
    } else if (e.type === "done") {
      if (this.streamingRaw) {
        this.history.push({ role: "bot", content: this.streamingRaw });
        this.persist();
        this.streamingRaw = "";
      }
    } else if (e.type === "error") {
      this.hideTyping();
      this.append("sd-bot", `⚠️ ${e.content ?? "Something went wrong."}`, false);
    }
  }

  private renderMsg(role: Role, content: string) {
    if (role === "user") {
      this.append("sd-user", content, false);
    } else if (role === "agent") {
      const label = document.createElement("div");
      label.className = "sd-agent-label";
      label.textContent = "Agent";
      this.msgs().appendChild(label);
      this.append("sd-agent", content, true);
    } else {
      this.append("sd-bot", content, true);
    }
  }

  private append(cls: string, text: string, asHtml: boolean): HTMLDivElement {
    const el = document.createElement("div");
    el.className = `sd-msg ${cls}`;
    if (asHtml) el.innerHTML = md(text);
    else el.textContent = text;
    this.msgs().appendChild(el);
    this.scroll();
    return el;
  }

  private showTyping() {
    this.typingEl = document.createElement("div");
    this.typingEl.className = "sd-msg sd-bot";
    this.typingEl.innerHTML = `<span class="sd-typing"><span></span><span></span><span></span></span>`;
    this.msgs().appendChild(this.typingEl);
    this.scroll();
  }
  private hideTyping() {
    if (this.typingEl) {
      this.typingEl.remove();
      this.typingEl = null;
    }
  }

  private addConfidence(conf: number) {
    const el = document.createElement("div");
    el.className = "sd-conf";
    el.textContent = `confidence ${(conf * 100).toFixed(0)}%`;
    this.msgs().appendChild(el);
  }
  private addCite(n: number, c: Citation) {
    const el = document.createElement("div");
    el.className = "sd-cite";
    el.textContent = `[${n}] ${c.title ?? "source"} · ${(c.score * 100).toFixed(0)}% match`;
    this.msgs().appendChild(el);
    this.scroll();
  }

  private msgs(): HTMLDivElement {
    return this.root.querySelector(".sd-msgs")!;
  }
  private scroll() {
    const m = this.msgs();
    if (m) m.scrollTop = m.scrollHeight;
  }
}

function esc(s: string): string {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

if (WIDGET_KEY) {
  const w = new SmartDeskWidget();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => w.init());
  } else {
    w.init();
  }
} else {
  console.warn("[SmartDesk] missing data-widget-key on <script> tag");
}
