<div align="center">

# 🤖 SmartDesk AI

### Turn your documentation into a 24/7 AI support agent.

**Multi-tenant SaaS** with **RAG-powered chatbot**, real-time WebSocket chat, embeddable widget, and human handoff.

[![Status](https://img.shields.io/badge/status-🚧_Active_Development-orange?style=for-the-badge)](https://github.com/PuriphatXXVII/SmartDesk-AI)
[![CI](https://github.com/PuriphatXXVII/SmartDesk-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/PuriphatXXVII/SmartDesk-AI/actions/workflows/ci.yml)
[![Security Scan](https://github.com/PuriphatXXVII/SmartDesk-AI/actions/workflows/security.yml/badge.svg)](https://github.com/PuriphatXXVII/SmartDesk-AI/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![pgvector](https://img.shields.io/badge/pgvector-0.4+-blue)
![Claude](https://img.shields.io/badge/Anthropic-Claude_Sonnet_4.6-D97757)

[📜 Architecture](docs/ARCHITECTURE.md) ·
[🗺️ Roadmap](docs/ROADMAP.md) ·
[🔒 Security](docs/SECURITY.md) ·
[🚀 Deploy guide](docs/DEPLOYMENT.md)

> 🚧 **Status:** Under active development — features being implemented per the [6-week roadmap](docs/ROADMAP.md). Live demo will be published once authentication, RAG pipeline, and persistent storage are wired end-to-end.

</div>

---

## 🎯 What is this?

Small businesses spend **$1.3T/year** on customer service. **60–80%** of questions are repetitive and could be auto-answered — but building a smart chatbot needs AI expertise most teams lack.

**SmartDesk AI** lets any business upload their docs, FAQ, or knowledge base and get an embeddable AI chatbot that:
- 💬 Answers naturally with **RAG (Retrieval Augmented Generation)** + source citations
- 🧠 Learns from real conversations
- 👥 Escalates to humans when confidence is low
- 📊 Surfaces customer pain points via analytics

---

## ✨ Key Features

### 👩‍💼 For Business Owners
- 📄 **Knowledge upload** — drag & drop PDF/DOCX/Markdown or paste URLs
- 🎨 **Widget customization** — brand colors, position, persona prompt
- 📊 **Analytics dashboard** — top questions, satisfaction, conversion funnels
- 👥 **Team management** — multi-user with roles (Admin / Agent / Viewer)
- 🔄 **Human handoff** — live takeover when AI confidence drops

### 👤 For End Users
- 💬 Embeddable chat widget (one `<script>` to install)
- ⚡ Real-time streaming responses
- 🌐 Multi-language support
- 📱 Mobile-responsive
- 🎫 Ticket creation when AI can't help

### 🛠️ For Developers
- 🔌 REST + WebSocket API
- 🪝 Webhooks (new conversation, low confidence, satisfaction)
- 📦 Public SDK for custom integrations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         End User Browser                         │
│  ┌──────────────────┐         ┌─────────────────────────────┐   │
│  │  Customer Site   │ ◄────── │  SmartDesk Widget (Vanilla) │   │
│  │  + <script>      │         │  WebSocket streaming chat   │   │
│  └──────────────────┘         └──────────────┬──────────────┘   │
└───────────────────────────────────────────────┼─────────────────┘
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Python)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────────────┐  │
│  │ Auth (Clerk)│ │ WebSocket   │ │  RAG Pipeline            │  │
│  │ Middleware  │ │ Chat Handler│ │  1. Embed query          │  │
│  └─────────────┘ └─────────────┘ │  2. Vector search        │  │
│  ┌─────────────┐ ┌─────────────┐ │  3. Rerank + filter      │  │
│  │ Ingestion   │ │ Analytics   │ │  4. LLM with context     │  │
│  │ Worker      │ │ Service     │ │  5. Stream response      │  │
│  └─────────────┘ └─────────────┘ └──────────────────────────┘  │
└──────┬─────────────────────────────────────┬────────────────────┘
       ▼                                     ▼
┌──────────────────┐               ┌────────────────────────┐
│  PostgreSQL      │               │  Claude API (Anthropic)│
│  + pgvector      │               │  + Embeddings (OpenAI) │
└──────────────────┘               └────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              Next.js 16 Dashboard (Vercel — deploy ready)        │
│   Owner / Admin / Agent UI — Knowledge mgmt, analytics, chat    │
└─────────────────────────────────────────────────────────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full deep dive.

---

## 🛠️ Tech Stack (latest as of May 2026)

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (App Router) · React · Tailwind v4 · shadcn/ui · Clerk auth · TanStack Query · Zustand | **16.2 · 19.2 · 4.3 · 7.3** |
| **Widget** | Vanilla TS · Rollup (<30KB bundle) | latest |
| **Backend** | FastAPI · Pydantic v2 · SQLAlchemy 2 · Alembic | **0.136 · 2.10 · 2.0.49** |
| **Database** | PostgreSQL + pgvector (vector search in-DB) | **16 · 0.4+** |
| **Queue / Cache** | Celery + Redis | latest |
| **AI** | Anthropic Claude `claude-sonnet-4-6` · OpenAI `text-embedding-3-small` | SDK **0.104 · 1.93** |
| **Auth** | Clerk (multi-tenant, MFA, OAuth) | **v7 Core 3** |
| **Security** | SlowAPI, custom CSP/HSTS middleware, bleach sanitization, PyJWT | latest |
| **Deploy** | Vercel (FE) · Railway/Fly (BE — planned) · Supabase (DB — planned) | — |
| **CI/CD** | GitHub Actions · Docker · Dependabot · CodeQL · Gitleaks | — |

> 🔒 See [docs/SECURITY.md](docs/SECURITY.md) for full threat model (STRIDE), defenses, and CVE patch tracking.

---

## 🚀 Quick Start

### Run locally (no Docker required)

```bash
git clone https://github.com/PuriphatXXVII/SmartDesk-AI.git
cd SmartDesk-AI

# Backend (works with SQLite — no Postgres needed for the demo)
cd backend
python -m venv .venv && .venv\Scripts\activate    # Windows
# source .venv/bin/activate                       # macOS/Linux
pip install -e ".[dev]"
cp .env.example .env  # uses SQLite + memory:// rate limiter
uvicorn app.main:app --reload

# Frontend (in another terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open:
- 🎨 Dashboard → http://localhost:3000
- 📜 API docs → http://localhost:8000/docs

---

## 📅 6-Week MVP Roadmap

| Week | Milestone | Status |
|------|-----------|--------|
| 1 | Project setup, DB schema, Auth scaffolding, dashboard skeleton | ✅ Done |
| 1 | Landing page polish + production CI/CD | ✅ Done |
| 1 | Clerk JWT verification + DB connection (real) | ⏳ Next up |
| 2 | Knowledge ingestion pipeline (PDF/DOCX/URL → chunks → embeddings) | ⏳ |
| 3 | RAG chat API with streaming + widget integration | ⏳ |
| 4 | Conversations view + analytics dashboard (real data) | ⏳ |
| 5 | Human handoff + multi-tenant isolation tests + rate limiting | ⏳ |
| 6 | Backend deploy + custom domain + demo video | ⏳ |

See [docs/ROADMAP.md](docs/ROADMAP.md) for week-by-week deliverables.

---

## 📁 Project Structure

```
SmartDesk-AI/
├── frontend/          # Next.js 16 dashboard (deployed on Vercel)
├── backend/           # FastAPI service (multi-tenant, RAG, WebSocket)
├── widget/            # Embeddable Vanilla TS widget (<30KB)
├── docs/              # Architecture, roadmap, security, deployment guides
├── .github/           # CI, security scans, Dependabot
└── docker-compose.yml # Local Postgres + Redis (optional)
```

---

## 📊 Why this project matters (for recruiters)

This demonstrates:

- ✅ **Full-stack ownership** — Frontend + Backend + DB + DevOps
- ✅ **Modern AI integration** — RAG, vector search, streaming LLMs, embeddings
- ✅ **System design** — multi-tenant SaaS, real-time WebSocket, background jobs
- ✅ **Production engineering** — auth, CSP, rate limiting, observability, CI/CD, security scanning
- ✅ **Product thinking** — real problem (customer support), real users, real metrics

---

## 📝 License

MIT — see [LICENSE](LICENSE)

## 🔒 Security Policy

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

<div align="center">

**Built with ❤️ by [Puriphat Srikamnoi](https://github.com/PuriphatXXVII)** · [Portfolio](https://puriphatxxvii.github.io/my-portfolio/)

</div>
