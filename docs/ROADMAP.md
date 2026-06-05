# 📅 SmartDesk AI — 6-Week MVP Roadmap

Goal: Ship a **production-deployed, demoable MVP** that you can put on your portfolio and link to a working live URL.

> ## ✅ Status: Shipped & live
> All six weekly milestones are complete — the MVP is **deployed to production** on
> **Vercel** (frontend) · **Railway** (backend) · **Supabase** (Postgres + pgvector) ·
> **Upstash** (Redis) · **Clerk** (auth).
> **🌐 Live demo → https://smart-desk-ai-lyart.vercel.app**
>
> Checkboxes below are the original week-by-week plan: **[x] = delivered**, unchecked
> items marked _“deferred”_ were intentionally pushed to post-MVP / stretch.

---

## Week 1 — Foundation (Setup & Infrastructure)

**Deliverables:**
- [x] Repo + folder structure
- [x] `docker-compose.yml` with Postgres (+ pgvector) and Redis
- [x] Backend skeleton: FastAPI app, config, DB connection, Alembic migrations
- [x] Database schema (initial): `organizations`, `users`, `knowledge_documents`, `document_chunks`, `conversations`, `messages`
- [x] Frontend skeleton: Next.js 16 App Router + Tailwind v4
- [x] Clerk auth integrated on frontend, JWT verification on backend (JWKS/RS256)
- [x] CI: GitHub Actions running lint + tests for both FE & BE
- [x] Health check endpoints

**Outcome:** Logged-in user lands on empty dashboard. No business logic yet, but the rails are laid.

---

## Week 2 — Knowledge Ingestion Pipeline

**Deliverables:**
- [x] File upload UI (drag & drop, PDF/DOCX/TXT/MD/HTML support)
- [ ] URL crawler (single page + sitemap option) — deferred
- [x] Backend ingestion endpoint (runs via FastAPI BackgroundTasks; Celery task kept for prod)
- [x] Worker pipeline:
  - Parse document (`pypdf` + `python-docx` + HTML/MD/TXT)
  - Chunk with overlap (tiktoken-based, ~500 tokens)
  - Embed each chunk (**Voyage AI** `voyage-3.5-lite` — 1024-dim, multilingual)
  - Store in `document_chunks` with pgvector
- [x] Progress tracking (job status visible in UI via polling)
- [x] List / preview / delete documents in dashboard

**Outcome:** User can upload "FAQ.pdf" and see "Processed: 47 chunks indexed."

---

## Week 3 — RAG Chat Engine + Widget MVP

**Deliverables:**
- [x] RAG pipeline service:
  - Embed user query
  - Vector similarity search (top-K from pgvector, filtered by org_id)
  - Build prompt with citations → call Claude with streaming → return tokens + source chunks
  - _(optional rerank step skipped — not needed for MVP answer quality)_
- [x] WebSocket endpoint for streaming chat
- [x] Conversation + message persistence
- [x] Widget v1: Vanilla TS, builds to a single ~8 KB JS file
  - Floating chat button → opens chat panel
  - Connects to backend WebSocket
  - Renders streamed responses with citation chips
- [x] Widget install snippet generator in dashboard

**Outcome:** Customer demo site loads widget → asks question → gets streamed AI answer grounded in uploaded docs.

---

## Week 4 — Dashboard Polish & Analytics

**Deliverables:**
- [x] Conversations view: list, filter by date/status, full transcript view (`/dashboard/conversations`)
- [x] Analytics dashboard (real data):
  - [x] Total conversations, messages, avg confidence
  - [ ] Top questions (clustered) — deferred (needs clustering)
  - [x] Satisfaction (thumbs up/down on messages) — `feedback` field + `POST /api/chat/feedback`
  - [x] Confidence-based auto-resolved % + daily series chart
- [x] Widget customization page (done in Week 3)
- [ ] Team members invite (multi-user per org) — Week 5
- [ ] Settings: API keys, webhook URLs — Week 5

**Outcome:** Dashboard feels like a real product. Recruiter clicking around sees substance.

---

## Week 5 — Human-in-the-Loop & Production-Readiness

**Deliverables:**
- [x] Confidence scoring on responses (low conf → auto-flag conversation as `handoff`)
- [x] Human handoff: agent takes over from the dashboard (reply as `agent`, resolve)
- [x] Conversations view with status filter (resolved / handoff) — Week 4 + Week 5
- [x] Multi-tenant isolation tests (org A cannot see/touch org B data) — `tests/test_handoff.py`
- [ ] Rate limiting per org (token bucket via Redis) — deferred (Redis unavailable locally)
- [x] Input/output guardrails (PII redaction, prompt-injection mitigation) — `security.py`
- [x] Webhook system (conversation.started, message.low_confidence, conversation.handoff) — HMAC-signed, `/api/settings`
- [ ] E2E test suite (Playwright for widget → backend → dashboard) — deferred
- [x] Realtime agent→widget delivery (agent replies pushed live via in-process pub/sub hub)

**Outcome:** Production-grade safety, security, and reliability.

---

## Week 6 — Launch (Deploy, Market, Document)

**Deliverables:**
- [x] Deploy backend to **Railway** (Docker) — https://smartdesk-ai-production.up.railway.app
- [x] Deploy frontend to **Vercel** — https://smart-desk-ai-lyart.vercel.app
- [x] Managed **Supabase** Postgres + pgvector & **Upstash** Redis wired in production
- [x] HTTPS/SSL on both (Vercel + Railway managed certificates)
- [ ] Deploy widget to a dedicated CDN (Cloudflare R2) — deferred (served from the app for now)
- [ ] Custom domain — deferred (using the free Vercel/Railway subdomains)
- [ ] Seed a public demo org so visitors can try without signing up — deferred
- [x] **Landing page** at root: hero, features, live demo widget embedded on the page
- [ ] 3-minute demo video / GIF walkthrough — deferred (the live demo link covers this)
- [x] Full README + architecture / security / deployment docs
- [ ] Social launch posts (dev.in.th, r/SideProject, Indie Hackers, LinkedIn) — deferred

**Outcome:** A real URL you can put on your résumé. A demo recruiters can use in 30 seconds.

---

## Post-MVP Stretch Goals (Months 2-3)

- 💳 Stripe billing (Free / Pro / Business tiers)
- 🌍 Multi-language responses
- 🔌 Integration marketplace (Slack, LINE, Discord, Intercom import)
- 📈 A/B testing for widget variants
- 🧠 Fine-tuned models per organization
- 🎙️ Voice mode (Whisper + TTS)
- 📊 Public Status Page

---

## Metrics That Tell A Story (Put These In Your Resume)

By end of week 6, aim to be able to say:
- "Built and deployed a multi-tenant SaaS serving X concurrent users with Y ms median response time"
- "Ingested Z documents, generated W embeddings, indexed in pgvector"
- "Achieved N% answer accuracy on M test questions, measured via thumbs-up rate"
- "End-to-end test coverage of K% across critical paths"
