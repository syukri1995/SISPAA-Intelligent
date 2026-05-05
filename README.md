## SISPAA Intelligent GovTech Router (Prototype)

Monorepo containing:
- **`backend/`**: FastAPI + LangGraph (Sense → Reason → Act), **TiDB (MySQL-compatible)** (memory + logs), optional Redis
- **`frontend/`**: Next.js 14 (App Router) dashboard (Tailwind + shadcn/ui style components)

### Quick Start

**See [LOCAL_SETUP.md](./LOCAL_SETUP.md) for detailed instructions.**

#### Without Docker (Recommended for Windows)
1. Install PostgreSQL 16+ and Node.js 18+
2. Create database `sispaa_router`
3. Backend: `cd backend && python -m venv .venv && .venv\Scripts\Activate.ps1 && pip install -r requirements.txt && uvicorn app.main:app --reload`
4. Frontend: `cd frontend && npm install && npm run dev`

#### With Docker (macOS/Linux)
```bash
docker compose up -d
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
cd frontend && npm install && npm run dev
```

Open:
- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`

### Railway deployment

If you deploy on Railway, see `RAILWAY.md`. Otherwise, configure `DATABASE_URL` to your TiDB cluster.

