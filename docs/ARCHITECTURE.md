# 🏛️ SmartDesk AI — Architecture Deep Dive

## 1. System Overview

SmartDesk AI is a **multi-tenant SaaS** that lets businesses train an AI chatbot on their own documents and embed it on their website. It consists of four major components:

1. **Dashboard (Next.js)** — Business owners manage knowledge, configure widget, view analytics.
2. **Backend API (FastAPI)** — Authentication, knowledge ingestion, RAG inference, conversation management.
3. **Widget (Vanilla TS)** — Lightweight script embedded on customer websites.
4. **Background Workers (Celery)** — Asynchronous document processing & embedding generation.

---

## 2. Data Model (Initial Schema)

```sql
-- Tenants
CREATE TABLE organizations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  plan         TEXT DEFAULT 'free',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   TEXT UNIQUE NOT NULL,
  email           TEXT NOT NULL,
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role            TEXT DEFAULT 'admin', -- admin | agent | viewer
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base
CREATE TABLE knowledge_documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_type    TEXT NOT NULL,  -- pdf | docx | url | text
  source_uri    TEXT,
  title          TEXT,
  status         TEXT DEFAULT 'pending', -- pending | processing | ready | failed
  chunk_count    INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_chunks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id    UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  org_id         UUID NOT NULL,  -- denormalized for fast filtering
  content        TEXT NOT NULL,
  embedding      vector(1536),   -- text-embedding-3-small
  metadata       JSONB DEFAULT '{}',
  chunk_index    INTEGER,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON document_chunks (org_id);

-- Conversations
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  visitor_id      TEXT,           -- anonymous browser fingerprint
  status          TEXT DEFAULT 'active', -- active | resolved | handoff
  assigned_agent_id UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role              TEXT NOT NULL, -- user | assistant | agent | system
  content           TEXT NOT NULL,
  citations         JSONB DEFAULT '[]',  -- [{chunk_id, score, snippet}]
  confidence        FLOAT,
  feedback          TEXT,  -- positive | negative | null
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Widget config per org
CREATE TABLE widget_configs (
  org_id          UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  primary_color   TEXT DEFAULT '#3b82f6',
  position        TEXT DEFAULT 'bottom-right',
  welcome_message TEXT DEFAULT 'Hi! How can I help you?',
  persona_prompt  TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. The RAG Pipeline

```
User question
    │
    ▼
┌───────────────────────┐
│ 1. Preprocess         │  trim, detect language, content moderation
└──────────┬────────────┘
           ▼
┌───────────────────────┐
│ 2. Embed query        │  OpenAI text-embedding-3-small (1536d)
└──────────┬────────────┘
           ▼
┌───────────────────────┐
│ 3. Vector search      │  pgvector cosine similarity
│    WHERE org_id = X   │  top 20 candidates
└──────────┬────────────┘
           ▼
┌───────────────────────┐
│ 4. Rerank (optional)  │  Cohere rerank or cross-encoder → top 5
└──────────┬────────────┘
           ▼
┌───────────────────────┐
│ 5. Build prompt       │  system + persona + context chunks + history
└──────────┬────────────┘
           ▼
┌───────────────────────┐
│ 6. Claude streaming   │  claude-sonnet-4-6, max_tokens=1024
└──────────┬────────────┘
           ▼
┌───────────────────────┐
│ 7. Post-process       │  extract citations, score confidence,
│                       │  PII redaction, flag for handoff if low conf
└──────────┬────────────┘
           ▼
    Stream to user
    Persist message + citations
```

### Confidence Scoring

Combine signals:
- Top retrieval score (cosine similarity)
- Model self-rated confidence (via structured output)
- Presence of "I don't know" / uncertainty markers in response

If confidence < threshold (e.g. 0.6) → flag conversation, emit webhook, surface in dashboard.

---

## 4. Multi-Tenancy & Security

- **Row-Level Security:** Every queryable table has `org_id`. All queries MUST filter by `org_id` derived from the authenticated user's token (backend never trusts client-supplied org_id).
- **Widget Auth:** Widget uses a public `widget_key` (tied to org). Rate-limited per visitor fingerprint.
- **Prompt Injection Defense:** System prompt is templated with clear delimiters; user input is wrapped in `<user_question>` tags; output filters reject responses that try to leak the system prompt.
- **PII Redaction:** Run regex + Microsoft Presidio on stored messages before persisting.

---

## 5. Scalability Considerations (Future)

- pgvector handles ~1M chunks per org with sub-100ms search. Beyond that → move to dedicated vector DB (Qdrant / Pinecone).
- Claude API calls are the bottleneck. Cache identical queries with Redis (semantic cache: embed question, check if similar one in last 1h had a high-rated answer).
- WebSocket connections: deploy backend behind a load balancer with sticky sessions, use Redis pub/sub for cross-instance message broadcasting.

---

## 6. Observability

- **Errors:** Sentry on both FE & BE
- **LLM traces:** Logfire (or Langfuse) — log every prompt, response, latency, cost
- **Product analytics:** Posthog (page views, feature usage, funnels)
- **Health/uptime:** Healthcheck endpoints + UptimeRobot

---

## 7. Cost Estimate (MVP, 100 orgs / 10K messages/month)

| Item | Cost |
|------|------|
| Vercel (FE) | $0 (hobby) |
| Railway / Fly (BE + worker) | ~$10/mo |
| Supabase Postgres + pgvector | $0–25/mo |
| Cloudflare R2 (file storage) | <$1/mo |
| Anthropic Claude API (~10K msgs × $0.005) | ~$50/mo |
| OpenAI embeddings | ~$2/mo |
| Clerk auth | $0 (free tier <10K MAU) |
| Sentry | $0 (free tier) |
| **Total** | **~$65/mo** |

Plenty of room to charge $29/mo Pro tier and break even at ~3 customers.
