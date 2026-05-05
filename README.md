## SISPAA Intelligent GovTech Router (Prototype)

Monorepo containing:
- **`backend/`**: FastAPI + LangGraph (Sense → Reason → Act), **TiDB (MySQL-compatible)** (memory + logs), optional Redis
- **`frontend/`**: Next.js 14 (App Router) dashboard (Tailwind + shadcn/ui style components)

### Local dev (recommended)

1) Start databases:

```bash
docker compose up -d
```

2) Backend:

```bash
cd backend
python -m venv .venv
. .venv/bin/activate  # Windows: .venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

3) Frontend:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open:
- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`

### Railway deployment

If you deploy on Railway, see `RAILWAY.md`. Otherwise, configure `DATABASE_URL` to your TiDB cluster.

