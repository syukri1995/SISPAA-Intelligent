# Local Development Setup (Without Docker)

## Prerequisites

- **Python 3.12+** ([Download](https://www.python.org/downloads/))
- **PostgreSQL 16+** ([Download for Windows](https://www.postgresql.org/download/windows/))
- **Node.js 18+** ([Download](https://nodejs.org/))

---

## 1. PostgreSQL Setup

### Install PostgreSQL
1. Download and run the PostgreSQL installer for Windows
2. Choose installation directory (e.g., `C:\PostgreSQL`)
3. Set superuser password (remember this!)
4. Accept port 5432 (default)
5. Finish installation

### Create Database
Open **pgAdmin 4** (installed with PostgreSQL):
1. Right-click **Databases** → **Create** → **Database**
2. Name: `sispaa_router`
3. Click **Save**

Or use PowerShell:
```powershell
psql -U postgres -c "CREATE DATABASE sispaa_router;"
```

---

## 2. Backend Setup

```powershell
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy environment file
Copy-Item .env.example .env
```

### Configure `.env`
Edit `backend/.env`:
```
APP_ENV=local
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/sispaa_router
CORS_ORIGINS=http://localhost:3000
GROQ_API_KEY=
```

Replace `YOUR_PASSWORD` with your PostgreSQL superuser password.

### Start Backend
```powershell
uvicorn app.main:app --reload --port 8000
```

Backend will be available at: **http://localhost:8000**
API Docs: **http://localhost:8000/docs**

---

## 3. Frontend Setup

Open **new PowerShell terminal**:

```powershell
cd frontend

# Install dependencies
npm install

# Copy environment file
Copy-Item .env.example .env.local

# Start dev server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

---

## 4. Test the System

### Via Frontend
1. Open http://localhost:3000
2. Navigate to **Submit Complaint**
3. Enter a complaint (e.g., "Pothole on Jalan Merdeka")
4. Click **Submit & Process**
5. View results on **Dashboard**

### Via API (curl)
```powershell
$body = @{
    complaint_text = "Bus broke down at LRT station"
    location_text = "Kuala Lumpur"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8000/complaint `
  -Method POST `
  -Headers @{'Content-Type'='application/json'} `
  -Body $body
```

---

## Troubleshooting

### PostgreSQL Connection Error
```
psycopg2.OperationalError: could not connect to server
```
**Solution**: 
- Verify PostgreSQL is running (Start Menu → Services → PostgreSQL)
- Check `DATABASE_URL` in `.env` matches your setup
- Verify database `sispaa_router` exists

### Port Already in Use
```
Address already in use
```
**Solution**:
```powershell
# Change port in command
uvicorn app.main:app --reload --port 8001
```

### Module Not Found
```
ModuleNotFoundError: No module named 'fastapi'
```
**Solution**:
- Ensure virtual environment is activated: `.venv\Scripts\Activate.ps1`
- Run: `pip install -r requirements.txt`

---

## Stopping Services

```powershell
# Backend: Ctrl+C in the terminal

# Frontend: Ctrl+C in the terminal

# PostgreSQL: Start Menu → Services → Stop PostgreSQL Service
```

---

## Next Steps

- View [README.md](./README.md) for project overview
- See [RAILWAY.md](./RAILWAY.md) for production deployment
