# 🤖 SmartDesk AI

> **AI-Powered Customer Support Platform** — Turn your documentation into a 24/7 intelligent support agent in minutes.

[![Status](https://img.shields.io/badge/status-MVP%20in%20development-yellow)]()
[![Tech](https://img.shields.io/badge/stack-Next.js%20%7C%20FastAPI%20%7C%20Claude%20AI-blue)]()

---

## 🎯 Problem Statement

Small and medium businesses spend **$1.3 trillion globally** on customer service every year. Most repetitive questions (60-80%) could be answered automatically — but building a smart chatbot requires AI expertise that most teams don't have.

**SmartDesk AI** lets any business upload their documentation, FAQs, or knowledge base, and instantly get an embeddable AI chatbot that:
- Answers questions in natural language using **RAG (Retrieval Augmented Generation)**
- Learns from real conversations and improves over time
- Escalates to human agents when confidence is low
- Provides analytics on customer pain points

---

## 💡 Key Features

### For Business Owners (Dashboard)
- 📄 **Knowledge Base Upload** — Drag & drop PDFs, DOCX, Markdown, or paste URLs
- 🎨 **Widget Customization** — Brand colors, position, welcome message, persona
- 📊 **Analytics Dashboard** — Top questions, satisfaction rate, conversion funnel
- 👥 **Team Management** — Multi-user with roles (Admin / Agent / Viewer)
- 🔄 **Human Handoff** — Live takeover when AI confidence < threshold
- 💬 **Conversation History** — Full transcripts with AI reasoning

### For End Users (Widget)
- 💬 Embeddable chat widget (one line of code to install)
- ⚡ Real-time streaming responses
- 🌐 Multi-language support (auto-detect)
- 📱 Mobile-responsive
- 🎫 Ticket creation when AI can't help

### For Developers (API)
- 🔌 REST + WebSocket API
- 🪝 Webhooks for events (new conversation, low confidence, satisfaction)
- 🛠️ Public SDK for custom integrations

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
                                                │
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
       │                                     │
       ▼                                     ▼
┌──────────────────┐               ┌────────────────────────┐
│  PostgreSQL      │               │  Claude API (Anthropic)│
│  + pgvector      │               │  + Embeddings          │
│  ────────────    │               │                        │
│  • organizations │               └────────────────────────┘
│  • knowledge_docs│
│  • doc_chunks    │
│  • conversations │
│  • messages      │
│  • analytics     │
└──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Dashboard (Vercel)                  │
│   Owner / Admin / Agent UI — Knowledge mgmt, analytics, chat    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack (latest as of May 2026)

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| **Frontend Dashboard** | Next.js (App Router) | **16.2** | Latest stable, includes CVE-2026-23869 RSC DoS fix |
| | React | **19.2.6** | Patched all 2025–2026 RSC vulnerabilities |
| | Tailwind CSS | **v4.3** | CSS-first config, 5× faster builds |
| | shadcn/ui (Radix + Tailwind v4) | latest | Accessible, copy-in components |
| | TanStack Query / Zustand | latest | Server + client state |
| **Embeddable Widget** | Vanilla TS + Rollup | latest | <30KB bundle, framework-agnostic |
| **Backend API** | FastAPI | **0.136.1** | Latest stable |
| | Pydantic v2 / SQLAlchemy | **2.10 / 2.0.49** | Strict validation + ORM |
| | Alembic | 1.14+ | Migrations |
| **Database** | PostgreSQL 16 + pgvector | 0.4+ | Vector search inside Postgres |
| **Background Jobs** | Celery + Redis | latest | Document ingestion + embeddings |
| **AI / RAG** | Anthropic Claude `claude-sonnet-4-6` | SDK **0.104.1** | Best reasoning |
| | OpenAI `text-embedding-3-small` | SDK 1.93+ | Cheap, high-quality embeddings |
| **Auth** | Clerk (`@clerk/nextjs` **v7.3.7**) | Core 3 | Multi-tenant, MFA, OAuth |
| **Security** | SlowAPI, secweb, bleach, PyJWT | latest | Rate limit, headers, sanitization, JWT |
| **Real-time** | FastAPI WebSocket + Redis pub/sub | — | Streaming chat |
| **File Storage** | AWS S3 / Cloudflare R2 | — | R2 = free egress |
| **Deployment** | Vercel (FE), Railway/Fly (BE), Supabase (DB) | — | Free tiers, easy scaling |
| **CI/CD** | GitHub Actions, Docker | — | Lint, type-check, test, security scan |
| **Observability** | Sentry, Posthog, Logfire | — | Errors + product + LLM traces |

> 🔒 See [docs/SECURITY.md](docs/SECURITY.md) for full threat model and defenses (CSP, HSTS, rate limiting, prompt-injection guards, PII redaction, multi-tenant isolation, CodeQL + Dependabot + Gitleaks scanning).

---

## 📁 Project Structure

```
SmartDesk-AI/
├── frontend/              # Next.js 14 dashboard app
│   ├── app/               # App Router pages
│   ├── components/        # Reusable UI components
│   ├── lib/               # API client, utils
│   └── public/
│
├── backend/               # FastAPI service
│   ├── app/
│   │   ├── api/           # Route handlers (auth, kb, chat, analytics)
│   │   ├── core/          # Config, security, DB
│   │   ├── models/        # SQLAlchemy models
│   │   ├── services/      # Business logic
│   │   └── rag/           # RAG pipeline (embed, retrieve, generate)
│   ├── tests/
│   ├── alembic/           # DB migrations
│   ├── pyproject.toml
│   └── Dockerfile
│
├── widget/                # Embeddable chat widget
│   ├── src/
│   ├── package.json
│   └── rollup.config.js
│
├── docs/
│   ├── ROADMAP.md
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
│
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml     # Local dev environment
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker + Docker Compose
- Anthropic API key
- OpenAI API key (for embeddings)

### Setup

```bash
# 1. Clone & enter
git clone <repo-url> && cd SmartDesk-AI

# 2. Start Postgres + Redis
docker-compose up -d postgres redis

# 3. Backend setup
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e .
alembic upgrade head
cp .env.example .env  # Fill in API keys
uvicorn app.main:app --reload

# 4. Frontend setup (in new terminal)
cd frontend
npm install
cp .env.example .env.local  # Fill in API URL + Clerk keys
npm run dev

# 5. Widget dev (optional)
cd widget
npm install
npm run dev
```

Access dashboard at `http://localhost:3000`, API at `http://localhost:8000`.

---

## 📅 6-Week MVP Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full week-by-week plan.

| Week | Milestone |
|------|-----------|
| 1 | Project setup, DB schema, Auth, basic dashboard skeleton |
| 2 | Knowledge base upload + ingestion pipeline (PDF/DOCX/URL → chunks → embeddings) |
| 3 | RAG chat API with streaming, widget MVP |
| 4 | Dashboard: conversations, analytics, widget customization |
| 5 | Polish: human handoff, multi-tenant isolation, rate limiting |
| 6 | Deploy to production, landing page, demo data, video walkthrough |

---

## 📊 Why This Project Matters (for Recruiters)

This project demonstrates:

- ✅ **Full-stack** ownership (FE + BE + DB + DevOps)
- ✅ **Modern AI** integration (RAG, vector search, streaming LLMs)
- ✅ **System design** (multi-tenant SaaS, real-time, background jobs)
- ✅ **Production engineering** (auth, observability, CI/CD, testing)
- ✅ **Product thinking** (real problem, real users, real metrics)

---

## 📝 License

MIT
