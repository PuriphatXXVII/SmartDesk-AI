/**
 * SmartDesk AI — embeddable chat widget (vanilla TS, no deps).
 *
 * Install:
 *   <script src="https://cdn.smartdesk.ai/smartdesk.js"
 *           data-widget-key="wk_xxx"
 *           data-api-url="https://api.smartdesk.ai"
 *           defer></script>
 *
 * The widget fetches its appearance from /api/widget/config?key=... and streams
 * answers over /api/chat/ws?key=... (RAG grounded in the org's knowledge base).
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

const script = document.currentScript as HTMLScriptElement | null;
const WIDGET_KEY = script?.dataset.widgetKey ?? "";
const API_URL = (script?.dataset.apiUrl ?? "http://localhost:8000").replace(/\/$/, "");
const WS_URL = (script?.dataset.wsUrl ?? API_URL.replace(/^http/, "ws"));

class SmartDeskWidget {
  private cfg: WidgetConfig = {
    primary_color: "#3b82f6",
    position: "bottom-right",
    welcome_message: "Hi! How can I help you?",
  };
  private root!: HTMLDivElement;
  private ws: WebSocket | null = null;
  private open = false;
  private streamingEl: HTMLDivElement | null = null;
  private conversationId: string | null = null;

  async init() {
    await this.loadConfig();
    this.root = document.createElement("div");
    this.root.id = "smartdesk-widget";
    document.body.appendChild(this.root);
    this.injectStyles();
    this.renderClosed();
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
      .sd-msg{padding:10px 14px;border-radius:14px;margin-bottom:10px;max-width:85%;font-size:14px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word}
      .sd-bot{background:#fff;border:1px solid #e5e7eb;color:#0f172a}
      .sd-user{background:${c};color:#fff;margin-left:auto}
      .sd-agent{background:#ecfdf5;border:1px solid #6ee7b7;color:#065f46}
      .sd-agent-label{font-size:11px;color:#059669;font-weight:600;margin:0 0 2px 4px}
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
    this.open = false;
    this.ws?.close();
    this.ws = null;
    this.root.innerHTML = `<button class="sd-fab" aria-label="Open chat">💬</button>`;
    this.root.querySelector(".sd-fab")!.addEventListener("click", () => this.openPanel());
  }

  private openPanel() {
    this.open = true;
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
    this.addBot(this.cfg.welcome_message);
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(`${WS_URL}/api/chat/ws?key=${encodeURIComponent(WIDGET_KEY)}`);
    this.ws.onmessage = (ev) => this.onEvent(JSON.parse(ev.data));
  }

  private send(text: string) {
    this.addUser(text);
    this.streamingEl = null;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ content: text }));
    } else {
      this.addBot("⚠️ Connection lost. Please reopen the chat.");
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
      if (!this.streamingEl) this.streamingEl = this.addBot("");
      this.streamingEl.textContent += e.content;
      this.scroll();
    } else if (e.type === "citations") {
      if (typeof e.confidence === "number") this.addConfidence(e.confidence);
      (e.citations ?? []).forEach((c, i) => this.addCite(i + 1, c));
    } else if (e.type === "agent" && e.content) {
      // A human support agent took over — render their reply distinctly, live.
      this.streamingEl = null;
      this.addAgent(e.content);
    } else if (e.type === "session") {
      this.conversationId = e.conversation_id ?? null;
    } else if (e.type === "error") {
      this.addBot(`⚠️ ${e.content ?? "Something went wrong."}`);
    }
  }

  private addAgent(t: string) {
    const label = document.createElement("div");
    label.className = "sd-agent-label";
    label.textContent = "Agent";
    this.msgs().appendChild(label);
    this.append("sd-agent", t);
  }

  private addUser(t: string) {
    this.append("sd-user", t);
  }
  private addBot(t: string): HTMLDivElement {
    return this.append("sd-bot", t);
  }
  private append(cls: string, text: string): HTMLDivElement {
    const el = document.createElement("div");
    el.className = `sd-msg ${cls}`;
    el.textContent = text;
    this.msgs().appendChild(el);
    this.scroll();
    return el;
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
