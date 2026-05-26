# Contributing to SmartDesk AI

Thanks for your interest! This is currently a personal portfolio project, but external contributions are welcome.

## Quick setup

```bash
git clone https://github.com/PuriphatXXVII/SmartDesk-AI.git
cd SmartDesk-AI

# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows
# source .venv/bin/activate       # macOS / Linux
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Without Docker, the backend defaults to **SQLite + in-memory rate limiter** — perfect for development. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full Postgres + Redis setup.

## Before opening a PR

```bash
# Backend
cd backend
ruff check .
pytest -q

# Frontend
cd frontend
npm run type-check
npm run build
```

CI runs the same checks on every PR — if it goes red, fix locally first.

## Commit style

Conventional commits, lowercase, present tense:

- `feat(api): add /api/conversations endpoint`
- `fix(widget): handle WebSocket reconnect on idle`
- `chore(deps): bump fastapi to 0.137`
- `docs(architecture): clarify RAG pipeline diagram`
- `test(security): cover CSP regression`

## Code style

- **Python:** ruff (config in `backend/pyproject.toml`) — line length 120, isort-style imports, `app/` as first-party
- **TypeScript:** Prettier defaults + Next.js ESLint preset
- **General:** `.editorconfig` enforces UTF-8 + LF + 2-space indent (Python = 4 spaces)

## Security

Never commit secrets. `.env` files are gitignored — only `.env.example` belongs in the repo.

If you find a vulnerability, **please don't open a public issue.** Use [GitHub Security Advisories](https://github.com/PuriphatXXVII/SmartDesk-AI/security/advisories/new) instead.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the 6-week plan. PRs that advance a roadmap milestone get priority review.
