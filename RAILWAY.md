## Railway deployment (optional) (backend + frontend)

This repo is ready to deploy as **two Railway services** (recommended):
- **Backend**: FastAPI (Python)
- **Frontend**: Next.js (Node)

### 1) Provision services

- Create a Railway **Project**
- Add **MySQL**/**TiDB** compatible database (or use your existing TiDB cluster)
- (Optional) Add **Redis** plugin

### 2) Backend service

- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Set variables (see `backend/.env.example`):
- `DATABASE_URL`
- `APP_ENV=production`
- `CORS_ORIGINS` (set to your frontend domain)
- `OPENAI_API_KEY` (optional; if not set, heuristic classifier is used)

Health check:
- `GET /healthz`

### 3) Frontend service

- **Root Directory**: `frontend`
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run start`

Set variables (see `frontend/.env.example`):
- `NEXT_PUBLIC_API_BASE_URL` (your backend URL, e.g. `https://<backend>.up.railway.app`)

### 4) Database tables

Tables auto-create on first backend boot (prototype). For managed production, migrate explicitly using `backend/schema.sql` or adopt Alembic.

