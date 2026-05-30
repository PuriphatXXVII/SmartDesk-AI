"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Lang = "en" | "th";

const en = {
  nav: {
    features: "Features",
    how: "How it works",
    pricing: "Pricing",
    dashboard: "Dashboard",
    chat: "Test Chat",
    knowledge: "Knowledge",
    widget: "Widget",
    conversations: "Conversations",
  },
  hero: {
    badge: "RAG-powered · Multi-tenant · Self-hostable",
    titleA: "Turn your docs into a ",
    titleB: "24/7 AI support agent",
    subtitle:
      "Upload your knowledge base, embed one line of code, and let SmartDesk AI resolve 80% of customer questions — accurately, instantly, with citations.",
    ctaPrimary: "Start free",
    ctaSecondary: "See live demo",
    stats: [
      { n: "80%", label: "Auto-resolved" },
      { n: "<2s", label: "Response time" },
      { n: "∞", label: "Conversations" },
    ],
  },
  features: {
    tag: "Features",
    title: "Everything you need to ship support AI",
    sub: "From raw documents to an embedded widget — in under 10 minutes.",
    items: [
      { title: "Upload anything", body: "PDF, DOCX, Markdown, or a full website crawl. We chunk, embed, and index it for you automatically." },
      { title: "Embeddable widget", body: "One <script> tag gives your site a 24/7 AI agent. Customize colors, position, and persona." },
      { title: "RAG with citations", body: "Every answer cites its source chunk, so your users — and you — can verify it instantly." },
      { title: "Human handoff", body: "Low-confidence chats are flagged automatically. Agents jump in live from the dashboard." },
      { title: "Analytics dashboard", body: "Top questions, satisfaction rate, and exactly where the AI struggles — all in one view." },
      { title: "Multi-tenant & secure", body: "Row-level org isolation, CSP, HSTS, rate-limiting, and PII redaction baked in by default." },
    ],
  },
  how: {
    tag: "How it works",
    title: "Live in three steps",
    sub: "No ML expertise required. If you can copy-paste, you can ship it.",
    steps: [
      { title: "Upload your knowledge", body: "Drag in PDFs, paste URLs, or connect Notion / Confluence. We parse and embed in seconds." },
      { title: "Customize your widget", body: "Brand colors, welcome message, and persona. Preview it live before you publish." },
      { title: "Embed one line of code", body: "Copy the <script> snippet, drop it on your site, and you're live. That's it." },
    ],
  },
  pricing: {
    tag: "Pricing",
    title: "Simple, honest pricing",
    sub: "No per-seat tax. No hidden token fees. Cancel anytime.",
    popular: "Popular",
    tiers: [
      { name: "Free", price: "$0", period: "forever", features: ["100 conversations / mo", "1 knowledge base", "Community support"], cta: "Start free" },
      { name: "Pro", price: "$29", period: "per month", features: ["5,000 conversations / mo", "Unlimited knowledge bases", "Email support", "Custom branding"], cta: "Start trial" },
      { name: "Business", price: "$99", period: "per month", features: ["50,000 conversations / mo", "Multi-user team", "Priority support", "SSO + audit logs"], cta: "Contact sales" },
    ],
  },
  demo: {
    tag: "Live demo",
    titleLive: "The widget is live on this page",
    titleIdle: "Try the widget right here",
    bodyLive:
      "Look bottom-right — that chat bubble is the real SmartDesk widget, talking to the same RAG backend that powers production. Click it and ask anything.",
    bodyIdle:
      "Once a demo widget key is configured, a real chat bubble appears here, powered by the same backend customers use in production.",
    foot: ["One script tag", "5.5 KB", "Real-time streaming", "Cites its sources"],
  },
  cta: {
    title: "Ship your AI support agent today",
    sub: "Free to start. No credit card. Be answering customer questions in ten minutes.",
    button: "Get started free",
  },
  footer: {
    copy: "© 2026 SmartDesk AI — built with Next.js, FastAPI & Claude",
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Last 7 days · Acme Inc.",
    upload: "Upload Document",
    statConversations: "Conversations",
    statAutoResolved: "Auto-resolved",
    statAvgResponse: "Avg. response",
    statSatisfaction: "Satisfaction",
    vsLastWeek: "vs last week",
    chartTitle: "Conversations / day",
    chartSub: "Last 7 days",
    range7: "Last 7 days",
    range30: "Last 30 days",
    recent: "Recent conversations",
    viewAll: "View all",
    kb: "Knowledge base",
    manage: "Manage",
    addDoc: "Add document",
    embed: "Embed snippet",
    pasteBefore: "Paste before </body> on your site:",
    copy: "Copy snippet",
    statusResolved: "resolved",
    statusHandoff: "handoff",
    conf: "conf.",
    statAvgConfidence: "Avg. confidence",
    empty: "No data yet — start a chat to see your stats.",
  },
  conversations: {
    title: "Conversations",
    subtitle: "Browse and inspect every chat your AI handled.",
    all: "All",
    resolved: "Resolved",
    handoff: "Handoff",
    empty: "No conversations in this range yet.",
    messages: "messages",
    selectHint: "Select a conversation to view its transcript.",
    back: "Back",
    agent: "Agent",
    replyPlaceholder: "Reply as an agent…",
    reply: "Send reply",
    resolve: "Mark resolved",
  },
  chat: {
    title: "Test your AI",
    subtitle: "Ask questions about your uploaded docs.",
    manageKnowledge: "Manage knowledge",
    empty: "Ask me anything about your knowledge base.",
    placeholder: "Type your question…",
    send: "Send",
    confidence: "confidence",
    handoff: "would hand off to human",
    match: "match",
    document: "document",
  },
  knowledge: {
    title: "Knowledge base",
    subtitle: "Upload docs — they're parsed, chunked & embedded for your AI.",
    testAI: "Test your AI",
    uploading: "Uploading…",
    clickUpload: "Click to upload a document",
    formats: "PDF, DOCX, TXT, MD, HTML · up to 25MB",
    documents: "Documents",
    empty: "No documents yet. Upload one above to get started.",
    delete: "Delete",
    untitled: "Untitled",
    chunks: "chunks",
    statusReady: "ready",
    statusProcessing: "processing",
    statusPending: "pending",
    statusFailed: "failed",
  },
  widget: {
    title: "Widget",
    subtitle: "Customize your embeddable chat widget and grab the install snippet.",
    loading: "loading…",
    primaryColor: "Primary color",
    position: "Position",
    bottomRight: "Bottom right",
    bottomLeft: "Bottom left",
    welcome: "Welcome message",
    persona: "Persona prompt (optional)",
    personaPlaceholder: "e.g. Friendly, concise, replies in the customer's language.",
    save: "Save changes",
    saving: "Saving…",
    saved: "Saved",
    livePreview: "Live preview",
    install: "Install snippet",
    pasteBefore: "Paste before </body> on your site.",
    copy: "Copy snippet",
    copied: "Copied!",
    widgetKey: "widget key:",
    support: "Support",
    type: "Type…",
    send: "Send",
  },
  auth: {
    signInDemo: "Sign in (demo mode)",
    signUpDemo: "Sign up (demo mode)",
    notConfigured: "Clerk is not configured yet. Add",
    toEnable: "to enable real authentication.",
    backHome: "← Back to home",
  },
  account: {
    offline: "backend offline",
    loading: "loading…",
  },
  common: {
    theme: "Toggle theme",
    language: "Language",
  },
};

export type Messages = typeof en;

const th: Messages = {
  nav: {
    features: "ฟีเจอร์",
    how: "วิธีใช้งาน",
    pricing: "ราคา",
    dashboard: "แดชบอร์ด",
    chat: "ทดสอบแชท",
    knowledge: "คลังความรู้",
    widget: "วิดเจ็ต",
    conversations: "บทสนทนา",
  },
  hero: {
    badge: "ขับเคลื่อนด้วย RAG · รองรับหลายองค์กร · ติดตั้งเองได้",
    titleA: "เปลี่ยนเอกสารของคุณให้เป็น",
    titleB: "ผู้ช่วยซัพพอร์ต AI ตลอด 24 ชม.",
    subtitle:
      "อัปโหลดคลังความรู้ของคุณ ฝังโค้ดเพียงบรรทัดเดียว แล้วให้ SmartDesk AI ตอบคำถามลูกค้าได้ถึง 80% อย่างแม่นยำ ทันที พร้อมอ้างอิงแหล่งที่มา",
    ctaPrimary: "เริ่มใช้ฟรี",
    ctaSecondary: "ดูตัวอย่างจริง",
    stats: [
      { n: "80%", label: "ตอบอัตโนมัติ" },
      { n: "<2 วิ", label: "เวลาตอบกลับ" },
      { n: "∞", label: "จำนวนแชท" },
    ],
  },
  features: {
    tag: "ฟีเจอร์",
    title: "ครบทุกอย่างที่ต้องใช้สร้าง AI ซัพพอร์ต",
    sub: "จากเอกสารดิบ สู่วิดเจ็ตที่ฝังบนเว็บ — ภายในไม่ถึง 10 นาที",
    items: [
      { title: "อัปโหลดได้ทุกอย่าง", body: "PDF, DOCX, Markdown หรือดึงทั้งเว็บไซต์ ระบบจะแบ่งชิ้น ฝัง embedding และทำดัชนีให้อัตโนมัติ" },
      { title: "วิดเจ็ตฝังบนเว็บ", body: "แค่แท็ก <script> เดียว เว็บคุณก็มีผู้ช่วย AI ตลอด 24 ชม. ปรับสี ตำแหน่ง และบุคลิกได้" },
      { title: "RAG พร้อมอ้างอิง", body: "ทุกคำตอบอ้างอิงแหล่งที่มา ทั้งคุณและลูกค้าตรวจสอบได้ทันที" },
      { title: "ส่งต่อให้คนจริง", body: "แชทที่ความมั่นใจต่ำจะถูกตั้งสถานะอัตโนมัติ ทีมงานเข้าไปตอบสดผ่านแดชบอร์ดได้" },
      { title: "แดชบอร์ดวิเคราะห์", body: "คำถามยอดฮิต คะแนนความพึงพอใจ และจุดที่ AI ตอบได้ไม่ดี รวมอยู่ในที่เดียว" },
      { title: "แยกองค์กร & ปลอดภัย", body: "แยกข้อมูลระดับองค์กร พร้อม CSP, HSTS, จำกัดอัตราเรียก และปกปิดข้อมูลส่วนตัวมาให้ในตัว" },
    ],
  },
  how: {
    tag: "วิธีใช้งาน",
    title: "พร้อมใช้ใน 3 ขั้นตอน",
    sub: "ไม่ต้องเชี่ยวชาญ ML ถ้าคุณ copy-paste เป็น ก็ใช้งานได้",
    steps: [
      { title: "อัปโหลดความรู้", body: "ลาก PDF มาวาง วาง URL หรือเชื่อม Notion / Confluence ระบบแยกและฝัง embedding ในไม่กี่วินาที" },
      { title: "ปรับแต่งวิดเจ็ต", body: "เลือกสีแบรนด์ ข้อความต้อนรับ และบุคลิก ดูตัวอย่างสดก่อนเผยแพร่" },
      { title: "ฝังโค้ดบรรทัดเดียว", body: "คัดลอกแท็ก <script> ไปวางบนเว็บ แล้วใช้งานได้เลย เท่านั้นเอง" },
    ],
  },
  pricing: {
    tag: "ราคา",
    title: "ราคาเรียบง่าย ตรงไปตรงมา",
    sub: "ไม่คิดตามจำนวนที่นั่ง ไม่มีค่า token แอบแฝง ยกเลิกได้ทุกเมื่อ",
    popular: "ยอดนิยม",
    tiers: [
      { name: "Free", price: "$0", period: "ตลอดชีพ", features: ["100 บทสนทนา / เดือน", "คลังความรู้ 1 ชุด", "ซัพพอร์ตจากชุมชน"], cta: "เริ่มใช้ฟรี" },
      { name: "Pro", price: "$29", period: "ต่อเดือน", features: ["5,000 บทสนทนา / เดือน", "คลังความรู้ไม่จำกัด", "ซัพพอร์ตทางอีเมล", "ปรับแบรนด์เองได้"], cta: "ทดลองใช้" },
      { name: "Business", price: "$99", period: "ต่อเดือน", features: ["50,000 บทสนทนา / เดือน", "ทีมหลายผู้ใช้", "ซัพพอร์ตแบบเร่งด่วน", "SSO + บันทึกการตรวจสอบ"], cta: "ติดต่อฝ่ายขาย" },
    ],
  },
  demo: {
    tag: "ตัวอย่างจริง",
    titleLive: "วิดเจ็ตกำลังทำงานอยู่บนหน้านี้",
    titleIdle: "ลองใช้วิดเจ็ตได้เลยตรงนี้",
    bodyLive:
      "มองมุมขวาล่าง — ปุ่มแชทนั่นคือวิดเจ็ต SmartDesk ของจริง ที่คุยกับ RAG backend ตัวเดียวกับที่ใช้งานจริง คลิกแล้วถามอะไรก็ได้",
    bodyIdle:
      "เมื่อตั้งค่า widget key สำหรับสาธิตแล้ว ปุ่มแชทจริงจะปรากฏที่นี่ ขับเคลื่อนด้วย backend ตัวเดียวกับที่ลูกค้าใช้งานจริง",
    foot: ["แท็กเดียว", "5.5 KB", "สตรีมเรียลไทม์", "อ้างอิงแหล่งที่มา"],
  },
  cta: {
    title: "เริ่มใช้ AI ซัพพอร์ตของคุณวันนี้",
    sub: "เริ่มฟรี ไม่ต้องใช้บัตรเครดิต ตอบคำถามลูกค้าได้ใน 10 นาที",
    button: "เริ่มใช้ฟรี",
  },
  footer: {
    copy: "© 2026 SmartDesk AI — สร้างด้วย Next.js, FastAPI และ Claude",
  },
  dashboard: {
    title: "แดชบอร์ด",
    subtitle: "7 วันล่าสุด · Acme Inc.",
    upload: "อัปโหลดเอกสาร",
    statConversations: "บทสนทนา",
    statAutoResolved: "ตอบอัตโนมัติ",
    statAvgResponse: "เวลาตอบเฉลี่ย",
    statSatisfaction: "ความพึงพอใจ",
    vsLastWeek: "จากสัปดาห์ก่อน",
    chartTitle: "บทสนทนา / วัน",
    chartSub: "7 วันล่าสุด",
    range7: "7 วันล่าสุด",
    range30: "30 วันล่าสุด",
    recent: "บทสนทนาล่าสุด",
    viewAll: "ดูทั้งหมด",
    kb: "คลังความรู้",
    manage: "จัดการ",
    addDoc: "เพิ่มเอกสาร",
    embed: "โค้ดฝังวิดเจ็ต",
    pasteBefore: "วางก่อน </body> บนเว็บของคุณ:",
    copy: "คัดลอกโค้ด",
    statusResolved: "ตอบแล้ว",
    statusHandoff: "ส่งต่อ",
    conf: "มั่นใจ",
    statAvgConfidence: "ความมั่นใจเฉลี่ย",
    empty: "ยังไม่มีข้อมูล — เริ่มแชทเพื่อดูสถิติ",
  },
  conversations: {
    title: "บทสนทนา",
    subtitle: "ดูและตรวจสอบทุกบทสนทนาที่ AI ของคุณจัดการ",
    all: "ทั้งหมด",
    resolved: "ตอบแล้ว",
    handoff: "ส่งต่อ",
    empty: "ยังไม่มีบทสนทนาในช่วงเวลานี้",
    messages: "ข้อความ",
    selectHint: "เลือกบทสนทนาเพื่อดูบทสนทนาแบบเต็ม",
    back: "ย้อนกลับ",
    agent: "เจ้าหน้าที่",
    replyPlaceholder: "ตอบในฐานะเจ้าหน้าที่…",
    reply: "ส่งคำตอบ",
    resolve: "ทำเครื่องหมายว่าแก้แล้ว",
  },
  chat: {
    title: "ทดสอบ AI ของคุณ",
    subtitle: "ถามคำถามเกี่ยวกับเอกสารที่คุณอัปโหลด",
    manageKnowledge: "จัดการคลังความรู้",
    empty: "ถามอะไรเกี่ยวกับคลังความรู้ของคุณก็ได้",
    placeholder: "พิมพ์คำถามของคุณ…",
    send: "ส่ง",
    confidence: "ความมั่นใจ",
    handoff: "ควรส่งต่อให้คนจริง",
    match: "ตรงกัน",
    document: "เอกสาร",
  },
  knowledge: {
    title: "คลังความรู้",
    subtitle: "อัปโหลดเอกสาร — ระบบจะแยก แบ่งชิ้น และฝัง embedding ให้ AI ของคุณ",
    testAI: "ทดสอบ AI",
    uploading: "กำลังอัปโหลด…",
    clickUpload: "คลิกเพื่ออัปโหลดเอกสาร",
    formats: "PDF, DOCX, TXT, MD, HTML · ไม่เกิน 25MB",
    documents: "เอกสาร",
    empty: "ยังไม่มีเอกสาร อัปโหลดด้านบนเพื่อเริ่มต้น",
    delete: "ลบ",
    untitled: "ไม่มีชื่อ",
    chunks: "ชิ้น",
    statusReady: "พร้อม",
    statusProcessing: "กำลังประมวลผล",
    statusPending: "รอคิว",
    statusFailed: "ล้มเหลว",
  },
  widget: {
    title: "วิดเจ็ต",
    subtitle: "ปรับแต่งวิดเจ็ตแชทที่ฝังได้ และรับโค้ดติดตั้ง",
    loading: "กำลังโหลด…",
    primaryColor: "สีหลัก",
    position: "ตำแหน่ง",
    bottomRight: "ล่างขวา",
    bottomLeft: "ล่างซ้าย",
    welcome: "ข้อความต้อนรับ",
    persona: "บุคลิก (ไม่บังคับ)",
    personaPlaceholder: "เช่น เป็นมิตร กระชับ ตอบเป็นภาษาเดียวกับลูกค้า",
    save: "บันทึก",
    saving: "กำลังบันทึก…",
    saved: "บันทึกแล้ว",
    livePreview: "ตัวอย่างสด",
    install: "โค้ดติดตั้ง",
    pasteBefore: "วางก่อน </body> บนเว็บของคุณ",
    copy: "คัดลอกโค้ด",
    copied: "คัดลอกแล้ว!",
    widgetKey: "widget key:",
    support: "ซัพพอร์ต",
    type: "พิมพ์…",
    send: "ส่ง",
  },
  auth: {
    signInDemo: "เข้าสู่ระบบ (โหมดสาธิต)",
    signUpDemo: "สมัครสมาชิก (โหมดสาธิต)",
    notConfigured: "ยังไม่ได้ตั้งค่า Clerk เพิ่ม",
    toEnable: "เพื่อเปิดใช้การยืนยันตัวตนจริง",
    backHome: "← กลับหน้าแรก",
  },
  account: {
    offline: "backend ออฟไลน์",
    loading: "กำลังโหลด…",
  },
  common: {
    theme: "สลับธีม",
    language: "ภาษา",
  },
};

const messages: Record<Lang, Messages> = { en, th };

const I18nCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Messages } | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Default "en" to match SSR; sync from localStorage after mount.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lang");
      if (stored === "en" || stored === "th") setLangState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute("lang", l);
  }, []);

  return (
    <I18nCtx.Provider value={{ lang, setLang, t: messages[lang] }}>{children}</I18nCtx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
