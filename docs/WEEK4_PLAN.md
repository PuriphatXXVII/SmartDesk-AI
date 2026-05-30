# 📊 Week 4 — Analytics & Conversations (build blueprint)

> Goal: turn the dashboard from **mock data → real, org-scoped data**, and add a real
> **Conversations** view (list + transcript). When this is done the dashboard "feels like a product."
>
> Status when this plan was written: landing + all dashboard pages are themed (light/dark) + bilingual
> (EN/TH). The dashboard currently shows **hardcoded mock** stats/chart/recent-conversations. Chat already
> **persists** conversations + messages. This week wires the UI to the DB.

---

## 0. Scope — done vs. remaining

From `ROADMAP.md` Week 4, status today:

| Item | State |
|------|-------|
| Widget customization page (color/position/welcome/persona) | ✅ done in Week 3 (`/dashboard/widget`) |
| Conversations view (list + filter + transcript) | ⬜ **Week 4** |
| Analytics (totals, time series, satisfaction, confidence) | ⬜ **Week 4** |
| Team invite (multi-user per org) | ⏭️ defer to Week 5 (needs Clerk Orgs) |
| Settings page (API keys / webhooks) | ⏭️ defer (small, do if time) |

**This week = the two ⬜ rows.** Keep it MVP; don't gold-plate.

---

## 1. Data model — what exists vs. what to add

Check `backend/app/models/conversation.py` first. Expected today:
- `Conversation`: `id`, `org_id`, `created_at`, (maybe) `status`, `flagged_for_handoff`, `visitor_id`.
- `Message`: `id`, `conversation_id`, `role` (`user`/`assistant`), `content`, `confidence`, `citations` (JSON), `created_at`.

**Add (one small migration `0004_message_feedback`):**
- `Message.feedback` — nullable smallint/enum: `+1` / `-1` / `null` (thumbs up/down). Powers the satisfaction metric.
- (Optional) `Conversation.last_message_at` for cheap sorting/preview, or derive via query.

> If `status` doesn't exist on `Conversation`, derive it: `handoff` if any message `flagged_for_handoff`,
> else `resolved`. Don't add columns you can compute cheaply at MVP scale.

Keep **everything org-scoped** via `get_current_org` — every query filters `org_id`. Never trust client input for org.

---

## 2. Backend — new endpoints

New router `backend/app/api/analytics.py` + extend conversations into `backend/app/api/conversations.py`
(or fold into existing `chat.py`). Register in `app/main.py`. Add tests in `backend/tests/`.

### 2.1 `GET /api/analytics/overview?range=7d|30d`  (authed, org-scoped)
Aggregate with SQL (`func.count`, `func.avg`, `date_trunc('day', created_at)`):
```json
{
  "conversations": 1247,
  "messages": 5310,
  "auto_resolved_pct": 83,           // 1 - handoff_rate
  "avg_confidence": 0.86,            // avg over assistant messages
  "satisfaction": { "up": 412, "down": 38, "score": 4.6 },  // from Message.feedback; null-safe
  "series": [ { "day": "2026-05-24", "count": 40 }, ... ]    // conversations/day for the range
}
```
Fill gaps so `series` always has one point per day in the range (zero-fill missing days) — the chart needs it.

### 2.2 `GET /api/conversations?range=&status=&limit=&cursor=`  (authed, org-scoped)
List newest-first, paginated. Each row:
```json
{ "id": "...", "visitor": "anon-3f2", "preview": "How do I reset my password?",
  "last_at": "2026-05-30T...", "status": "resolved", "confidence": 0.94, "message_count": 4 }
```

### 2.3 `GET /api/conversations/{id}`  (authed, org-scoped — 404 if not this org)
Full transcript: conversation meta + ordered `messages[]` (role, content, citations, confidence, feedback, created_at).

### 2.4 `POST /api/chat/feedback`  { message_id, value: 1 | -1 }  (public via widget_key OR authed)
Sets `Message.feedback`. Reuse the widget-key auth path that `/api/chat/ws` uses so the embedded widget can
send thumbs without a Clerk token. Validate the message belongs to the key's org.

**Backend gate before commit:** `ruff check .` + `pytest -q` (add `test_analytics.py`, `test_conversations.py`;
follow `test_widget.py` for the authed/public split; the heavy ones skip without Postgres like `test_rag_integration`).

---

## 3. Frontend — wire real data + new page

Keep semantic tokens (`bg-surface`, `text-muted`, …) and add every new string to **both** `en` and `th`
in `lib/i18n.tsx`. All these pages are `"use client"` and fetch via `useApi()` (`lib/use-api.ts`).

### 3.1 Replace mock on `app/dashboard/page.tsx`
- `StatGrid` ← `/api/analytics/overview` (conversations, auto_resolved_pct, avg_confidence, satisfaction.score).
- `ConversationsChart` ← `series` (keep the SVG, or swap to **recharts** — already a dependency — `AreaChart`
  with an indigo→violet gradient `<defs>`). Add the 7d/30d `<select>` → refetch with `range`.
- `RecentConversations` ← first ~5 of `/api/conversations`. Make "View all" link to `/dashboard/conversations`.
- Add loading skeletons (`animate-pulse` on `bg-surface-2` blocks) + an empty state for new orgs (no data yet).

### 3.2 New page `app/dashboard/conversations/page.tsx`
- Filters: date range + status (`all/resolved/handoff`) as pill buttons.
- List uses the `/api/conversations` shape from §2.2; click a row → transcript.
- Transcript: a right-side drawer (or `/dashboard/conversations/[id]`) calling §2.3, rendering bubbles
  (reuse the `Bubble` look from `chat/page.tsx` — consider extracting it to `components/chat-bubble.tsx`).
- Add `{ href: "/dashboard/conversations", label: t.nav.conversations }` to the `links` array in
  `components/dashboard-nav.tsx` (+ `nav.conversations` string in both langs).

### 3.3 (Optional) thumbs up/down
- In the embeddable widget (`widget/src/index.ts`) add 👍/👎 under each assistant message → `POST /api/chat/feedback`.
  Rebuild: `cd widget && npm run build` → copy to `frontend/public/smartdesk.js`. Bumps the satisfaction metric.

---

## 4. Suggested build order (each step independently shippable)

1. **Migration** `0004_message_feedback` → `alembic upgrade head`.
2. **`/api/analytics/overview`** + test. Wire `StatGrid` + chart to it. (Biggest visual win first.)
3. **`/api/conversations` (list)** + test. Wire `RecentConversations`.
4. **`/api/conversations/{id}`** + the new Conversations page + nav link.
5. **`/api/chat/feedback`** + widget thumbs (optional / last).
6. Update `CLAUDE.md` status → Week 4 ✅, tick `ROADMAP.md` boxes, run FE `type-check`+`build`, BE `ruff`+`pytest`, push, watch CI green.

## 5. Definition of done
- No mock numbers left on `/dashboard`; every figure traces to a DB query.
- A fresh org sees sensible **zero-states**, not crashes.
- Conversations list + transcript work, org-scoped (org A can't open org B's conversation → 404).
- New strings exist in EN **and** TH; pages work in light **and** dark.
- `ruff` + `pytest` + `type-check` + `build` all green; CI green after push.

## 6. Guardrails (don't regress)
- Every query org-scoped via `get_current_org`. Aggregate in SQL, not Python loops over all rows.
- Don't hardcode colors (use tokens) or copy (use `t.*`). No emoji icons — use lucide-react.
- Don't change the embedding dim or weaken security middleware. Don't commit secrets.
