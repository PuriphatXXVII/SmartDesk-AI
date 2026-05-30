# 📅 SmartDesk AI — 6-Week MVP Roadmap

Goal: Ship a **production-deployed, demoable MVP** that you can put on your portfolio and link to a working live URL.

---

## Week 1 — Foundation (Setup & Infrastructure)

**Deliverables:**
- [x] Repo + folder structure
- [ ] `docker-compose.yml` with Postgres (+ pgvector) and Redis
- [ ] Backend skeleton: FastAPI app, config, DB connection, Alembic migrations
- [ ] Database schema (initial): `organizations`, `users`, `knowledge_documents`, `document_chunks`, `conversations`, `messages`
- [ ] Frontend skeleton: Next.js 14 App Router, Tailwind, shadcn/ui installed
- [ ] Clerk auth integrated on frontend, JWT verification on backend
- [ ] CI: GitHub Actions running lint + tests for both FE & BE
- [ ] Health check endpoints + Sentry wiring

**Outcome:** Logged-in user lands on empty dashboard. No business logic yet, but the rails are laid.

---

## Week 2 — Knowledge Ingestion Pipeline

**Deliverables:**
- [ ] File upload UI (drag & drop, PDF/DOCX/TXT/MD support)
- [ ] URL crawler (single page + sitemap option)
- [ ] Backend ingestion endpoint → enqueues Celery job
- [ ] Worker pipeline:
  - Parse document (use `unstructured` or `pypdf` + `python-docx`)
  - Chunk with overlap (recursive character splitter, ~500 tokens)
  - Embed each chunk (OpenAI `text-embedding-3-small`)
  - Store in `document_chunks` with pgvector
- [ ] Progress tracking (job status visible in UI via polling/SSE)
- [ ] List / preview / delete documents in dashboard

**Outcome:** User can upload "FAQ.pdf" and see "Processed: 47 chunks indexed."

---

## Week 3 — RAG Chat Engine + Widget MVP

**Deliverables:**
- [ ] RAG pipeline service:
  - Embed user query
  - Vector similarity search (top-K from pgvector, filtered by org_id)
  - Optional rerank step
  - Build prompt with citations
  - Call Claude with streaming
  - Return tokens + source chunks
- [ ] WebSocket endpoint for streaming chat
- [ ] Conversation + message persistence
- [ ] Widget v1: Vanilla TS, builds to single `<30KB` JS file
  - Floating chat button → opens chat panel
  - Connects to backend WebSocket
  - Renders streamed responses with citation chips
- [ ] Widget install snippet generator in dashboard

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
- [ ] Webhook system (conversation.started, message.low_confidence, etc.) — deferred
- [ ] E2E test suite (Playwright for widget → backend → dashboard) — deferred
- [ ] Realtime agent→widget delivery (agent replies pushed live to the embedded widget) — deferred (needs broker)

**Outcome:** Production-grade safety, security, and reliability.

---

## Week 6 — Launch (Deploy, Market, Document)

**Deliverables:**
- [ ] Deploy backend to Railway / Fly.io (with autoscaling)
- [ ] Deploy frontend to Vercel
- [ ] Deploy widget to CDN (Cloudflare R2 + CDN)
- [ ] Custom domain + SSL
- [ ] Seed demo organization with sample knowledge base (so visitors can try without signing up)
- [ ] **Landing page** at root: hero, features, live demo widget on the page itself, pricing (placeholder)
- [ ] 3-minute demo video / GIF walkthrough for portfolio
- [ ] Full README + architecture doc
- [ ] Post launch on dev.in.th, Reddit r/SideProject, Indie Hackers, LinkedIn

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
