/**
 * SmartDesk AI — Embeddable chat widget
 *
 * Usage:
 *   <script src="https://cdn.smartdesk.ai/widget.js"
 *           data-widget-key="wk_xxx"
 *           defer></script>
 */

interface WidgetConfig {
  widgetKey: string;
  apiUrl?: string;
  wsUrl?: string;
  primaryColor?: string;
  position?: "bottom-right" | "bottom-left";
  welcomeMessage?: string;
}

class SmartDeskWidget {
  private config: Required<WidgetConfig>;
  private ws: WebSocket | null = null;
  private root!: HTMLDivElement;
  private isOpen = false;

  constructor(config: WidgetConfig) {
    this.config = {
      apiUrl: "https://api.smartdesk.ai",
      wsUrl: "wss://api.smartdesk.ai",
      primaryColor: "#3b82f6",
      position: "bottom-right",
      welcomeMessage: "Hi! How can I help you?",
      ...config,
    };
    this.mount();
  }

  private mount(): void {
    this.root = document.createElement("div");
    this.root.id = "smartdesk-widget";
    this.root.innerHTML = this.renderClosed();
    document.body.appendChild(this.root);
    this.injectStyles();
    this.attachEvents();
  }

  private renderClosed(): string {
    return `
      <button class="sd-fab" aria-label="Open chat">💬</button>
    `;
  }

  private renderOpen(): string {
    return `
      <div class="sd-panel">
        <div class="sd-header">
          <span>SmartDesk Support</span>
          <button class="sd-close" aria-label="Close">✕</button>
        </div>
        <div class="sd-messages">
          <div class="sd-message sd-bot">${this.config.welcomeMessage}</div>
        </div>
        <form class="sd-input">
          <input type="text" placeholder="Type your question..." />
          <button type="submit">Send</button>
        </form>
      </div>
    `;
  }

  private injectStyles(): void {
    const c = this.config.primaryColor;
    const style = document.createElement("style");
    style.textContent = `
      #smartdesk-widget { position: fixed; ${
        this.config.position === "bottom-left" ? "left: 20px;" : "right: 20px;"
      } bottom: 20px; z-index: 999999; font-family: system-ui, sans-serif; }
      .sd-fab { width: 56px; height: 56px; border-radius: 50%; background: ${c};
                color: white; border: none; cursor: pointer; font-size: 24px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      .sd-panel { width: 360px; height: 520px; background: white; border-radius: 12px;
                  display: flex; flex-direction: column; overflow: hidden;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
      .sd-header { background: ${c}; color: white; padding: 12px 16px;
                   display: flex; justify-content: space-between; align-items: center; }
      .sd-close { background: none; border: none; color: white; cursor: pointer; font-size: 18px; }
      .sd-messages { flex: 1; overflow-y: auto; padding: 16px; }
      .sd-message { padding: 8px 12px; border-radius: 12px; margin-bottom: 8px; max-width: 80%; }
      .sd-bot { background: #f1f5f9; }
      .sd-user { background: ${c}; color: white; margin-left: auto; }
      .sd-input { display: flex; border-top: 1px solid #e5e7eb; padding: 8px; }
      .sd-input input { flex: 1; border: 1px solid #d1d5db; border-radius: 8px;
                        padding: 8px 12px; outline: none; }
      .sd-input button { background: ${c}; color: white; border: none;
                         border-radius: 8px; padding: 0 16px; margin-left: 8px; cursor: pointer; }
    `;
    document.head.appendChild(style);
  }

  private attachEvents(): void {
    this.root.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("sd-fab")) this.open();
      if (target.classList.contains("sd-close")) this.close();
    });

    this.root.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = (e.target as HTMLFormElement).querySelector("input");
      if (input?.value) this.sendMessage(input.value);
    });
  }

  private open(): void {
    this.isOpen = true;
    this.root.innerHTML = this.renderOpen();
    this.connect();
  }

  private close(): void {
    this.isOpen = false;
    this.ws?.close();
    this.root.innerHTML = this.renderClosed();
  }

  private connect(): void {
    this.ws = new WebSocket(
      `${this.config.wsUrl}/api/chat/ws?key=${this.config.widgetKey}`
    );
    this.ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      this.appendMessage(data.content, "bot");
    };
  }

  private sendMessage(text: string): void {
    this.appendMessage(text, "user");
    this.ws?.send(JSON.stringify({ content: text }));
    const input = this.root.querySelector("input");
    if (input) input.value = "";
  }

  private appendMessage(text: string, who: "bot" | "user"): void {
    const messages = this.root.querySelector(".sd-messages");
    if (!messages) return;
    const el = document.createElement("div");
    el.className = `sd-message sd-${who}`;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }
}

const script = document.currentScript as HTMLScriptElement | null;
const widgetKey = script?.dataset.widgetKey;
if (widgetKey) {
  new SmartDeskWidget({ widgetKey });
}

(window as unknown as { SmartDeskWidget: typeof SmartDeskWidget }).SmartDeskWidget =
  SmartDeskWidget;

export { SmartDeskWidget };
