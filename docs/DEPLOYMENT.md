# 🚀 SmartDesk AI — Deployment Guide

## Overview

| Service | Hosts | Cost (MVP) |
|---------|-------|------------|
| **Vercel** | Frontend (Next.js dashboard) | Free (hobby) |
| **Railway / Fly.io** | Backend (FastAPI + worker) | ~$5–10/mo |
| **Supabase / Neon** | PostgreSQL + pgvector | Free tier |
| **Upstash** | Redis (rate limit + Celery broker) | Free tier |
| **Cloudflare R2** | Object storage (uploaded docs) | Free egress |

For the MVP demo we ship **frontend only** first — it works perfectly with mock data.

---

## 1. Deploy Frontend to Vercel (5 minutes)

### Prerequisites
- GitHub account (already have)
- Code pushed to `main` branch (already done)

### Step-by-step

1. Go to **https://vercel.com/new**
2. Sign in with **GitHub** (first time only — Vercel will ask for repo access)
3. In the **"Import Git Repository"** list, find **`SmartDesk-AI`** → click **Import**
4. **Configure Project:**
   - **Project Name:** `smartdesk-ai` (or whatever you like)
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** click **Edit** → select **`frontend`** *(important — our repo is a monorepo)*
   - **Build Command:** `next build` *(default — leave as is)*
   - **Output Directory:** `.next` *(default)*
   - **Install Command:** `npm install` *(default)*
5. **Environment Variables** *(optional for now — landing page works without them)*:
   - `NEXT_PUBLIC_API_URL` = `https://api-placeholder.smartdesk.ai`
   - `NEXT_PUBLIC_WS_URL` = `wss://api-placeholder.smartdesk.ai`
   - *(Add Clerk keys here later when you wire up auth)*
6. Click **Deploy**
7. Wait 2–3 minutes ⏱️
8. Done! Vercel gives you a URL like `https://smartdesk-ai-xxx.vercel.app`

### What you get automatically
- ✅ HTTPS + global CDN
- ✅ Preview deployments on every PR
- ✅ Auto-deploy on every push to `main`
- ✅ Analytics + Web Vitals
- ✅ Free for hobby projects

### Custom domain (optional)
- Settings → Domains → Add `yourdomain.com`
- Vercel will tell you exactly which DNS records to add

---

## 2. Deploy Backend to Railway (15 minutes — when ready)

### Prerequisites
- Real Postgres + Redis (Supabase + Upstash recommended)
- Anthropic API key + Voyage API key (embeddings) + a Clerk application

### Steps

1. Create accounts:
   - **Supabase** → free Postgres with pgvector pre-installed
   - **Upstash** → free Redis
2. In Supabase SQL editor: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Go to **https://railway.app/new**
4. **Deploy from GitHub repo** → pick `SmartDesk-AI`
5. **Add service** → choose `backend` as the build context
6. **Environment Variables:**
   ```
   APP_ENV=production
   APP_DEBUG=false
   APP_SECRET_KEY=<run: python -c "import secrets; print(secrets.token_urlsafe(64))">
   DATABASE_URL=<from Supabase>
   REDIS_URL=<from Upstash>
   ANTHROPIC_API_KEY=<real key>
   VOYAGE_API_KEY=<real key — preferred embedding provider; OPENAI_API_KEY optional alt>
   # Clerk (REQUIRED in prod — without these every dashboard request is 401)
   CLERK_SECRET_KEY=<Clerk dashboard>
   CLERK_PUBLISHABLE_KEY=<Clerk dashboard>
   CLERK_JWT_ISSUER=https://<your-app>.clerk.accounts.dev
   CLERK_JWKS_URL=https://<your-app>.clerk.accounts.dev/.well-known/jwks.json
   CLERK_WEBHOOK_SECRET=<Clerk > Webhooks>
   CORS_ORIGINS=https://your-frontend.vercel.app
   ALLOWED_HOSTS=your-backend.up.railway.app
   ```
7. **Build & Start commands** (auto-detected from Dockerfile):
   - Build: `docker build .`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
8. **After deploy:** SSH in (or use Railway shell) and run `alembic upgrade head`

### Connecting frontend to backend
Once backend is live, set these Vercel env vars and redeploy:
- `NEXT_PUBLIC_API_URL` = `https://your-backend.up.railway.app`
- `NEXT_PUBLIC_WS_URL` = `wss://your-backend.up.railway.app`
- `NEXT_PUBLIC_SITE_URL` = `https://your-frontend.vercel.app` — the widget embed snippet points customers at `<site>/smartdesk.js`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_...`
- `CLERK_SECRET_KEY` = `sk_live_...`
- `NEXT_PUBLIC_DEMO_WIDGET_KEY` = *(optional)* a widget key to show the live demo on the landing page

### Hosting the embeddable widget
The compiled widget ships from the frontend at `/smartdesk.js`. `frontend/public/smartdesk.js`
is committed for exactly this reason, so Vercel serves it with no extra setup. **When the
widget source changes**, rebuild and re-commit it:

```bash
cd widget && npm run build
cp dist/smartdesk.js ../frontend/public/smartdesk.js   # Copy-Item on Windows
```

---

## 3. Production Checklist (before public launch)

- [ ] Rotate `APP_SECRET_KEY` to a strong random value
- [ ] Set `APP_DEBUG=false`
- [ ] Verify `/docs` and `/openapi.json` return 404 in production (we disable them when `APP_DEBUG=false`)
- [ ] Set real `ALLOWED_HOSTS` + `CORS_ORIGINS` (no localhost in prod)
- [ ] Enable Sentry: set `SENTRY_DSN`
- [ ] Connect Posthog for product analytics
- [ ] Add Clerk production keys (replace `pk_test_*` with `pk_live_*`)
- [ ] Run `pip-audit` + `npm audit` one final time
- [ ] Smoke test: signup → upload doc → get answer end-to-end
- [ ] Set up uptime monitoring (UptimeRobot, free)
- [ ] Configure custom domain + email for alerts

---

## 4. Useful Vercel commands (if you install CLI later)

```bash
npm i -g vercel
vercel login           # authenticate
vercel                 # deploy preview (from frontend/)
vercel --prod          # deploy production
vercel env pull        # download env vars to .env.local
vercel logs            # tail prod logs
```
