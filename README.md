<div align="center">

# 🤖 SmartDesk AI

### Turn your documentation into a 24/7 AI support agent.

**Multi-tenant SaaS** — a RAG-powered support chatbot you embed with one `<script>` tag: real-time streaming chat, source-cited answers, live human handoff, analytics, and webhooks.

### 🌐 [**Try the live demo →**](https://smart-desk-ai-lyart.vercel.app)

[![Live demo](https://img.shields.io/badge/demo-live-22c55e?style=flat&logo=vercel&logoColor=white)](https://smart-desk-ai-lyart.vercel.app)
[![CI](https://github.com/PuriphatXXVII/SmartDesk-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/PuriphatXXVII/SmartDesk-AI/actions/workflows/ci.yml)
[![Security Scan](https://github.com/PuriphatXXVII/SmartDesk-AI/actions/workflows/security.yml/badge.svg)](https://github.com/PuriphatXXVII/SmartDesk-AI/actions/workflows/security.yml)
[![Tests](https://img.shields.io/badge/tests-40_passing-success?style=flat)](backend/tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![pgvector](https://img.shields.io/badge/pgvector-vector_search-blue)

[🌐 Live demo](https://smart-desk-ai-lyart.vercel.app) ·
[📜 Architecture](docs/ARCHITECTURE.md) ·
[🗺️ Roadmap](docs/ROADMAP.md) ·
[🔒 Security](docs/SECURITY.md) ·
[🚀 Deploy guide](docs/DEPLOYMENT.md)

</div>

---

## 🎯 What is this?

Businesses spend a fortune answering the same customer questions over and over — most of which are already documented somewhere. **SmartDesk AI** lets any business upload their docs, FAQ, or help center and instantly get an embeddable chatbot that:

- 💬 Answers naturally using **RAG (Retrieval-Augmented Generation)** — grounded in the company's own content, **with source citations** (no hallucinated answers)
- 👥 **Escalates to a human** automatically when the AI's confidence is low — and the agent replies appear in the customer's widget **live**
- 📊 Surfaces top questions, satisfaction, and where the AI struggles via an **analytics dashboard**
- 🔌 Fires **webhooks** so teams can wire alerts into Slack / LINE / their own systems

It's the kind of product Intercom Fin or Zendesk AI offer — built from scratch as a full-stack reference implementation.

---

## ✅ What's built (and working)

This is a **feature-complete MVP** — every capability below is implemented, wired end-to-end, and covered by a green CI pipeline (40 backend tests, lint, security scans).

| Area | Highlights |
|------|-----------|
| **Auth & tenancy** | Clerk JWT auth · auto-provisioned orgs · strict per-org data isolation (with tests) |
| **Knowledge** | Upload PDF / DOCX / TXT / MD / HTML → parse → chunk → **Voyage** embeddings → pgvector |
| **RAG engine** | Vector similarity search + Claude answers grounded in retrieved chunks, with citations & a confidence score |
| **Embeddable widget** | One `<script>` tag · vanilla TS · ~8 KB · WebSocket streaming · markdown rendering · typing indicator · per-tab history |
| **Human handoff** | Low-confidence chats auto-flag · agents reply from the dashboard · replies pushed to the widget **in real time** |
| **Analytics** | Live dashboard — conversations, auto-resolved %, avg confidence, satisfaction, daily trend |
| **Conversations** | Full transcript view, status filters, agent reply + resolve |
| **Webhooks** | HMAC-SHA256-signed outbound events (`conversation.started`, `message.low_confidence`, `conversation.handoff`) |
| **Polish** | Light/dark theme · bilingual UI (EN/TH) · responsive · accessible |
| **Security** | CSP/HSTS headers · rate limiting · prompt-injection & PII guards · JWT verification (JWKS) |

> 🚀 **Live in production** — frontend on **Vercel**, backend on **Railway**, Postgres + pgvector on **Supabase**, Redis on **Upstash**, auth on **Clerk**. [Try it now →](https://smart-desk-ai-lyart.vercel.app)

---

## ✨ Features by audience

**👩‍💼 Business owners** — knowledge upload, widget customization (color/position/persona), analytics, conversations inbox, human takeover, webhook integrations.

**👤 End users** — embeddable streaming chat widget, source-cited answers, optional name capture, mobile-friendly, replies in the customer's own language.

**🛠️ Developers** — REST + WebSocket API, HMAC-signed webhooks, one-line embed snippet, fully typed codebase.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         End-user browser                          │
│  ┌──────────────────┐         ┌─────────────────────────────┐    │
│  │  Customer site   │ ◄────── │  SmartDesk widget (vanilla)  │   │
│  │  + one <script>  │         │  WebSocket streaming chat    │   │
│  └──────────────────┘         └──────────────┬──────────────┘    │
└────────────────────────────────────────────────┼─────────────────┘
                                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI backend (Python)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────────────┐    │
│  │ Auth (Clerk)│ │ WebSocket   │ │  RAG pipeline            │    │
│  │ middleware  │ │ chat + hub  │ │  1. embed query (Voyage) │    │
│  └─────────────┘ └─────────────┘ │  2. vector search        │    │
│  ┌─────────────┐ ┌─────────────┐ │  3. build cited context  │    │
│  │ Ingestion   │ │ Analytics + │ │  4. Claude (streamed)    │    │
│  │ pipeline    │ │ webhooks    │ │  5. confidence + handoff │    │
│  └─────────────┘ └─────────────┘ └──────────────────────────┘    │
└──────┬──────────────────────────────────────┬────────────────────┘
       ▼                                      ▼
┌──────────────────┐               ┌─────────────────────────────┐
│  PostgreSQL      │               │  Anthropic Claude (answers) │
│  + pgvector      │               │  + Voyage AI (embeddings)   │
└──────────────────┘               └─────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 Next.js 16 dashboard (App Router)                 │
│   Owner/agent UI — knowledge, analytics, conversations, widget    │
└─────────────────────────────────────────────────────────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full deep dive.

---

## 🛠️ Tech stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Clerk auth · TanStack Query · Zustand |
| **Widget** | Vanilla TypeScript · Rollup (~8 KB bundle, zero runtime deps) |
| **Backend** | FastAPI · Pydantic v2 · SQLAlchemy 2 · Alembic |
| **Database** | PostgreSQL 16 + pgvector (in-database vector search) |
| **AI** | Anthropic Claude `claude-sonnet-4-6` (answers) · Voyage AI `voyage-3.5-lite` (multilingual embeddings) |
| **Auth** | Clerk (multi-tenant, OAuth, JWT/JWKS) |
| **Realtime** | WebSocket streaming + in-process pub/sub hub for agent → widget delivery |
| **Security** | Rate limiting (SlowAPI) · CSP/HSTS middleware · prompt-injection & PII guards · HMAC-signed webhooks |
| **CI/CD** | GitHub Actions · Docker · Dependabot · CodeQL · Gitleaks |
| **Hosting** | **Vercel** (frontend) · **Railway** (backend, Docker) · **Supabase** (Postgres + pgvector) · **Upstash** (Redis) · **Clerk** (auth) |

> 🔒 See [docs/SECURITY.md](docs/SECURITY.md) for the full threat model (STRIDE), defenses, and dependency policy.

---

## 🚀 Quick start

### Option A — zero-dependency dev (no Docker, no keys)

Runs against SQLite + an in-memory rate limiter; embeddings fall back to a deterministic stub and Claude returns a canned answer — so the full UI and upload → retrieve → answer loop works with **no external services**.

```bash
git clone https://github.com/PuriphatXXVII/SmartDesk-AI.git
cd SmartDesk-AI

# --- Backend ---
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows  (source .venv/bin/activate on macOS/Linux)
pip install -e ".[dev]"
cp .env.example .env              # SQLite + memory:// — no Postgres needed
uvicorn app.main:app --reload

# --- Frontend (new terminal) ---
cd frontend
npm install
cp .env.example .env.local        # Clerk optional — the UI runs in "demo mode"
npm run dev
```

- 🎨 Dashboard → http://localhost:3000
- 📜 API docs → http://localhost:8000/docs

### Option B — full RAG stack (Docker)

```bash
docker compose up -d postgres redis     # pgvector + Redis
cd backend && alembic upgrade head       # create tables
# add real CLERK_*, ANTHROPIC_API_KEY, and VOYAGE_API_KEY to .env, then run as above
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full dev workflow.

---

## 🗺️ Roadmap

| Week | Milestone | Status |
|------|-----------|--------|
| 1 | Auth (Clerk), multi-tenant DB, dashboard skeleton, CI/CD | ✅ Done |
| 2 | Knowledge ingestion: PDF/DOCX/URL → chunk → embed → pgvector | ✅ Done |
| 3 | RAG chat with streaming + embeddable WebSocket widget | ✅ Done |
| 4 | Conversations view + analytics dashboard (real data) | ✅ Done |
| 5 | Human handoff · realtime agent→widget · webhooks · isolation tests | ✅ Done |
| 6 | Production deploy — Vercel · Railway · Supabase · Upstash · Clerk (**live**) | ✅ Done |

**🎉 All six milestones shipped — the app is live at [smart-desk-ai-lyart.vercel.app](https://smart-desk-ai-lyart.vercel.app).**

See [docs/ROADMAP.md](docs/ROADMAP.md) for week-by-week deliverables.

---

## 📁 Project structure

```
SmartDesk-AI/
├── frontend/          # Next.js 16 dashboard + marketing site
├── backend/           # FastAPI service (multi-tenant, RAG, WebSocket, webhooks)
├── widget/            # Embeddable vanilla-TS chat widget (~8 KB)
├── docs/              # Architecture, roadmap, security, deployment
├── .github/           # CI, security scans, Dependabot
└── docker-compose.yml # Local Postgres + pgvector + Redis
```

---

## 📊 Why this project

A single, cohesive system that demonstrates:

- **Full-stack ownership** — frontend, backend, database, widget, and DevOps
- **Applied AI** — RAG, vector search, streaming LLM responses, multilingual embeddings, grounded answers with citations
- **System design** — multi-tenant SaaS, real-time WebSockets + pub/sub, background ingestion
- **Production engineering** — auth, security hardening, rate limiting, CI/CD, security scanning, 40 tests
- **Product thinking** — a real problem (customer support), real roles, real metrics

---

## 📝 License

MIT — see [LICENSE](LICENSE). Vulnerability reporting in [SECURITY.md](SECURITY.md).

<div align="center">

**Built by [Puriphat Srikamnoi](https://github.com/PuriphatXXVII)** · [Portfolio](https://puriphatxxvii.github.io/my-portfolio/)

</div>
