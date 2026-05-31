# 🔒 SmartDesk AI — Security Posture

> Threat model and defenses applied across the stack. Keep this document updated as the threat landscape evolves.

---

## 1. Threat Model (STRIDE)

| Threat | Examples in our context | Mitigation |
|--------|-------------------------|------------|
| **Spoofing** | Forged JWTs, fake widget keys | Clerk JWKS verification, signed widget keys, HSTS |
| **Tampering** | Modifying API requests, injected XSS | CSP, Pydantic validation, React auto-escaping + widget HTML-escaping |
| **Repudiation** | Users denying actions | Audit log of admin actions, immutable Sentry trail |
| **Information Disclosure** | Stealing PII, prompt-leak attacks | PII redaction, row-level org_id isolation, hardened system prompt |
| **Denial of Service** | Flooding chat endpoint, huge uploads | SlowAPI rate limits, upload size cap, Redis-backed quotas |
| **Elevation of Privilege** | Tenant A reading Tenant B's data | All queries filter by `org_id` derived from JWT (never from client) |

---

## 2. Stack-level Security Layers

### Frontend (Next.js 16)
- **Strict CSP** with `frame-ancestors 'none'`, `object-src 'none'` ([next.config.js](../frontend/next.config.js))
- **HSTS** `max-age=2y; preload`
- **X-Frame-Options: DENY** — blocks clickjacking
- **Permissions-Policy** disables camera/mic/geo/cohort by default
- `poweredByHeader: false` — don't leak framework version
- Clerk middleware protects all routes except explicit allowlist
- React 19.2.6+ (patches CVE-2025-* RSC vulnerabilities)
- Next.js 16.2+ (patches CVE-2026-23869 RSC DoS)

### Backend (FastAPI 0.136)
- **TrustedHostMiddleware** — rejects unknown Host headers
- **CORS** strictly allowlisted, explicit methods + headers
- **Security headers** via `secweb` (CSP, HSTS, X-CTO, X-FO, Referrer-Policy)
- **SlowAPI rate limiting** — per-IP & per-key, Redis-backed for multi-instance
- **Pydantic v2** validates all inputs at the boundary
- **`/docs` and `/openapi.json` disabled in production**
- **Sentry `send_default_pii=False`** — never ships user data
- **Bandit + pip-audit** in CI catches vulnerable deps + insecure patterns

### Authentication
- **Clerk** handles password/OAuth/MFA — we never touch credentials
- JWTs verified via Clerk JWKS (RS256, issuer + audience checked)
- Refresh handled by Clerk SDK; backend is purely stateless

### Data Layer
- **Row-Level org isolation**: every model has `org_id`, every query filters by it
- **Parameterized queries only** — SQLAlchemy ORM (no raw SQL with f-strings)
- **PostgreSQL** with TLS in production
- **Backups** daily, encrypted at rest

### AI / Prompt Safety
- **System prompt** uses clear delimiters; user input wrapped in `<user_input>` tags
- **Prompt-injection heuristic** flags suspicious queries (logged, not blocked)
- **PII redaction** strips emails/phones/cards before storage
- **Confidence scoring** routes low-confidence chats to human agents
- **Output filter** rejects responses leaking system prompt fragments
- **Token cost cap** per org per day to prevent bill-bombing

### File Uploads
- MIME type allowlist (PDF/DOCX/TXT/MD)
- Size cap (default 25MB)
- TODO: magic-bytes re-verification + ClamAV scan
- Storage with random keys, not original filenames

### Widget (embedded on customer sites)
- Loaded via `<script>` with `data-widget-key`
- Widget keys are public but **rate-limited per visitor fingerprint**
- WebSocket connection verifies `Origin` header against org's allowed domains
- Input sanitized client + server side
- No iframe sandbox escape — widget runs in host page context but only does DOM injection in its own `#smartdesk-widget` container

---

## 3. Secrets Management

- `.env` files are gitignored
- Production secrets live in Vercel / Railway env vars (never in repo)
- Rotate Anthropic/OpenAI keys quarterly
- Sentry DSN treated as sensitive (rotate if leaked)

---

## 4. Dependency Security

- `pip-audit` runs in CI weekly + on every PR
- `npm audit --audit-level=high` runs in CI
- Dependabot enabled for both ecosystems
- Manual review for any major version bump

---

## 5. Logging & Observability

- **Sentry** — exceptions, performance traces (no PII)
- **Structured logs** via `structlog` (JSON in production)
- **LLM trace log** records prompt fingerprint + token count + latency (never the user's raw text)

---

## 6. Incident Response Checklist

1. Rotate affected secrets immediately
2. Disable affected feature/endpoint via feature flag
3. Notify affected orgs within 24h
4. Post-mortem in `docs/incidents/`
5. Add regression test

---

## 7. Open Security TODOs (Pre-Production)

- [x] Clerk JWT verification end-to-end (RS256 + JWKS) — implemented in `app/core/clerk.py`
- [ ] Add CSRF tokens to dashboard mutating endpoints
- [ ] Set up Snyk / GitHub Advanced Security scanning
- [ ] Upgrade prompt-injection detection from heuristics to LLM-as-judge / Lakera Guard
- [ ] Magic-bytes upload validation + ClamAV (size cap already enforced)
- [ ] Penetration test before public launch
- [ ] SOC 2 prep (audit logs, access reviews)

---

## 8. Known Patched CVEs (May 2026)

| CVE | Component | Fixed in |
|-----|-----------|----------|
| CVE-2026-23869 | Next.js RSC (DoS) | Next.js 16.2+ |
| CVE-2025-* | React Server Components | React 19.2.4+ |
| CVE-2024-53981 | python-multipart DoS | python-multipart 0.0.18+ |

This project pins versions above the safe minimum for all of the above.
