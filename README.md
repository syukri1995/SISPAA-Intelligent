# SISPAA Intelligent GovTech Router

A production-ready prototype for intelligent complaint routing and work order management in Malaysian government services. This system automates the classification, routing, and tracking of public complaints across multiple government agencies (DBKL, APAD, KKM).

**Status**: Fully functional prototype | **Version**: 0.1.0 | **License**: MIT

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Components](#system-components)
- [API Endpoints](#api-endpoints)
- [Quick Start](#quick-start)
- [Local Development](#local-development)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Database Schema](#database-schema)
- [Contributing](#contributing)

---

## 📌 Overview

**SISPAA Intelligent GovTech Router** streamlines the complaint management process by:

1. **Accepting** complaints from citizens
2. **Classifying** complaints into 5 categories using AI (with fallback heuristics)
3. **Routing** to responsible agencies (DBKL, APAD, KKM, or OTHER)
4. **Generating** work orders with priority levels
5. **Tracking** through audit logs
6. **Notifying** citizens with confirmation emails

### Problem Statement

Public complaints often get misdirected due to manual classification, leading to:
- Delayed responses (can take weeks)
- Lost complaints (miscategorized)
- Duplicate work across agencies
- Poor citizen satisfaction

### Solution

This system uses **LangGraph** (AI orchestration) to intelligently route complaints with:
- Automatic confidence-based retry logic (if confidence < 0.7)
- Support for Groq API (or heuristic fallback if API unavailable)
- Real-time audit logging
- Integration with `api.data.gov.my` for data enrichment

---

## 🏗️ Architecture

### System Workflow (LangGraph)

```
User Complaint
       ↓
    ┌─────────────────────────────────┐
    │    SENSE NODE                   │
    │  - Extract metadata             │
    │  - Validate input               │
    │  - Fetch external data (api.data.gov.my)
    └─────────────────────────────────┘
       ↓
    ┌─────────────────────────────────┐
    │    REASON NODE                  │
    │  - Classify complaint           │
    │  - Map to agency                │
    │  - Calculate confidence score   │
    └─────────────────────────────────┘
       ↓
    ┌─────────────────────────────────┐
    │  CONFIDENCE CHECK               │
    │  Score < 0.7? → Retry (max 3x) │
    └─────────────────────────────────┘
       ↓
    ┌─────────────────────────────────┐
    │    ACT NODE                     │
    │  - Generate work order          │
    │  - Render citizen email         │
    │  - Persist to database          │
    └─────────────────────────────────┘
       ↓
  Complaint COMPLETED
```

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                  │
│  Dashboard | Submit | Work Orders | Analytics | Logs     │
└──────────────────────────────────────────────────────────┘
                           ↓ (HTTP/REST)
┌──────────────────────────────────────────────────────────┐
│                   FASTAPI BACKEND                         │
│  POST   /complaint              Submit new complaint      │
│  GET    /status/{id}            Query complaint status    │
│  GET    /logs                   View audit logs           │
│  GET    /metrics                Dashboard KPIs            │
│  GET    /complaints/recent      Recent complaints         │
└──────────────────────────────────────────────────────────┘
         ↓ (LangGraph Orchestration)
┌──────────────────────────────────────────────────────────┐
│              LANGGRAPH WORKFLOW ENGINE                    │
│  Sense → Reason (→ Retry if needed) → Act               │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│              POSTGRESQL DATABASE                          │
│  Tables: complaints, classifications, work_orders, logs  │
└──────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### Core Features
- ✅ **AI-Powered Classification** - Automatic complaint categorization (supports Groq API + heuristic fallback)
- ✅ **Smart Routing** - Route to DBKL, APAD, KKM based on complaint type
- ✅ **Confidence Retry Logic** - Re-classify if confidence < 0.7 (up to 3 retries)
- ✅ **Work Order Generation** - Auto-generate with priority (LOW/MEDIUM/HIGH)
- ✅ **Audit Trail** - Complete event logging for compliance
- ✅ **Real-time Dashboard** - Live KPIs and workflow status
- ✅ **Email Notifications** - Personalized citizen emails with work order IDs

### Bonus Features
- ✅ **Priority Detection** - Keywords like "accident", "urgent" trigger HIGH priority
- ✅ **External API Integration** - Real `api.data.gov.my` fuel price enrichment
- ✅ **Metrics & Analytics** - Charts (Recharts) for complaints by category, agency, time
- ✅ **Responsive UI** - Tailwind CSS + shadcn/ui-style components
- ✅ **Health Check** - `/healthz` endpoint for monitoring

---

## 🔧 Tech Stack

### Backend
- **FastAPI** (0.136.1) - Modern async Python web framework
- **LangGraph** (1.1.10) - AI orchestration & stateful workflows
- **Groq** (1.2.0) - Optional LLM for intelligent classification
- **SQLAlchemy** (2.0.39) - ORM for database abstraction
- **asyncpg** (0.31.0) - Async PostgreSQL driver
- **Pydantic** (2.12.5) - Data validation & settings
- **httpx** (0.28.1) - Async HTTP client for external APIs

### Frontend
- **Next.js** (14.2.35) - React framework with App Router
- **React** (18.3.0) - UI library
- **Tailwind CSS** (3.4.10) - Utility-first CSS
- **Recharts** (2.12.0) - React charts library
- **TypeScript** (5.5.4) - Type-safe JavaScript

### Database
- **PostgreSQL** (16+) - Primary RDBMS
- **asyncpg** - Async connection pool

### DevOps
- **Docker & Docker Compose** - Containerization (optional)
- **Railway** - Cloud deployment platform
- **Python 3.13** - Backend runtime
- **Node.js 18+** - Frontend runtime

---

## 📦 System Components

### Backend Structure
```
backend/
├── app/
│   ├── main.py                      # FastAPI app initialization
│   ├── api/
│   │   └── routes.py                # All API endpoints
│   ├── core/
│   │   └── config.py                # Settings & environment variables
│   ├── db/
│   │   ├── models.py                # SQLAlchemy models
│   │   ├── session.py               # Database connection setup
│   │   └── init_db.py               # Table creation
│   ├── langgraph/
│   │   ├── graph.py                 # Workflow orchestration (Sense→Reason→Act)
│   │   └── state.py                 # Workflow state definitions
│   ├── services/
│   │   ├── classifier.py            # AI classification (Groq + heuristics)
│   │   ├── priority.py              # Priority detection from keywords
│   │   ├── email.py                 # Email template rendering
│   │   ├── audit.py                 # Audit logging
│   │   ├── agency_router.py         # Simulated agency API calls
│   │   └── data_gov_my.py           # External data.gov.my integration
│   └── schemas/
│       ├── complaint.py             # Request/response schemas
│       └── logs.py                  # Log schemas
├── requirements.txt                 # Python dependencies
├── .env.example                     # Environment template
└── schema.sql                       # PostgreSQL DDL
```

### Frontend Structure
```
frontend/
├── app/
│   ├── layout.tsx                   # Root layout with Navbar & Sidebar
│   ├── page.tsx                     # Home page (Dashboard redirect)
│   ├── globals.css                  # Tailwind imports
│   ├── dashboard/
│   │   ├── page.tsx                 # KPI cards, workflow panel, recent complaints
│   │   └── loading.tsx              # Loading skeleton
│   ├── submit/
│   │   └── page.tsx                 # Complaint submission form
│   ├── work-orders/
│   │   ├── page.tsx                 # Work order list with details
│   │   └── loading.tsx
│   ├── analytics/
│   │   └── page.tsx                 # Charts (pie, line, bar)
│   └── logs/
│       ├── page.tsx                 # Timeline of audit events
│       └── loading.tsx
├── components/
│   ├── Navbar.tsx                   # Top navigation
│   ├── Sidebar.tsx                  # Left navigation menu
│   ├── KPIcard.tsx                  # KPI display component
│   ├── WorkflowStepper.tsx          # Visual workflow progress
│   └── ComplaintTable.tsx           # Reusable table component
├── lib/
│   ├── api.ts                       # API client (fetch wrappers)
│   └── cn.ts                        # Tailwind class merger
├── types/
│   ├── complaint.ts                 # Complaint interfaces
│   └── workorder.ts                 # Work order interfaces
├── package.json                     # Dependencies & scripts
├── next.config.js                   # Next.js configuration
├── tailwind.config.ts               # Tailwind theming
├── postcss.config.js                # PostCSS setup
└── tsconfig.json                    # TypeScript configuration
```

---

## 🔌 API Endpoints

### Core Endpoints

#### **POST /complaint**
Submit a new complaint for processing.

**Request:**
```json
{
  "complaint_text": "Pothole on Jalan Merdeka blocking traffic",
  "location_text": "Kuala Lumpur, Malaysia",
  "image_url": "https://example.com/photo.jpg"
}
```

**Response:**
```json
{
  "complaint_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "current_step": "Act",
  "category": "Infrastructure Damage",
  "agency": "DBKL",
  "confidence": 0.92,
  "work_order_id": "660e8400-e29b-41d4-a716-446655440001",
  "priority": "HIGH",
  "citizen_email_preview": "..."
}
```

#### **GET /status/{complaint_id}**
Query the current status of a complaint.

**Response:**
```json
{
  "complaint_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "category": "Infrastructure Damage",
  "agency": "DBKL",
  "confidence": 0.92,
  "work_order_id": "660e8400-e29b-41d4-a716-446655440001",
  "priority": "HIGH"
}
```

#### **GET /logs?limit=200**
Retrieve audit logs of all system events.

**Response:**
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "complaint_id": "550e8400-e29b-41d4-a716-446655440000",
    "event_type": "COMPLAINT_RECEIVED",
    "message": "Complaint received",
    "payload": {},
    "created_at": "2026-05-05T14:30:00+08:00"
  },
  {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "complaint_id": "550e8400-e29b-41d4-a716-446655440000",
    "event_type": "SENSE_COMPLETED",
    "message": "Sense node completed",
    "payload": {"metadata": {...}},
    "created_at": "2026-05-05T14:30:01+08:00"
  }
]
```

#### **GET /metrics**
Fetch dashboard KPIs.

**Response:**
```json
{
  "total_complaints_today": 42,
  "pending_cases": 5,
  "auto_resolved_pct": 88.1,
  "avg_response_time_minutes": null
}
```

#### **GET /complaints/recent?limit=25**
Get recent complaints for dashboard.

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "COMPLETED",
    "timestamp": "2026-05-05T14:30:00+08:00",
    "category": "Infrastructure Damage",
    "agency": "DBKL",
    "confidence": 0.92
  }
]
```

#### **GET /healthz**
Health check endpoint.

**Response:**
```json
{"ok": true}
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.12+**
- **PostgreSQL 16+**
- **Node.js 18+**
- **git**

### Installation (5 minutes)

**1. Clone & Install Backend Dependencies**
```bash
git clone https://github.com/syukri1995/SISPAA-Intelligent.git
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1          # Windows
source .venv/bin/activate           # macOS/Linux
pip install -r requirements.txt
```

**2. Configure Database**
```bash
# PostgreSQL must be running
psql -U postgres -h localhost -c "CREATE DATABASE sispaa_router;"
```

**3. Setup Environment**
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials:
# DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@localhost:5432/sispaa_router
```

**4. Start Backend**
```bash
$env:PYTHONPATH = "."  # Windows PowerShell
export PYTHONPATH=.    # macOS/Linux
uvicorn app.main:app --reload --port 8000
```

**5. Setup & Start Frontend** (new terminal)
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3001 (or 3000 if available)
- **API Docs**: http://localhost:8000/docs
- **Database**: PostgreSQL on localhost:5432

---

## 💻 Local Development

### Running Tests (Frontend)
```bash
cd frontend
npm run build    # Build for production
npm run lint     # ESLint
```

### Running Tests (Backend)
```bash
cd backend
pytest tests/    # (pytest not in requirements yet; add if needed)
```

### Hot Reload
- **Backend**: Uvicorn watches `backend/app/**` for changes
- **Frontend**: Next.js fast refresh on file save

### Database Migrations
Tables auto-create on first run via SQLAlchemy. For manual setup:
```bash
psql -U postgres -d sispaa_router -f backend/schema.sql
```

### Stopping Services
```bash
# Backend: Ctrl+C in backend terminal
# Frontend: Ctrl+C in frontend terminal
# PostgreSQL: Windows Services → Stop PostgreSQL
```

---

## 📂 Project Structure

```
.
├── backend/                    # Python FastAPI backend
│   ├── app/
│   ├── requirements.txt
│   ├── .env.example
│   └── schema.sql
├── frontend/                   # Next.js 14 frontend
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── types/
│   ├── package.json
│   └── .env.example
├── docker-compose.yml          # Optional: PostgreSQL + Redis
├── README.md                   # This file
├── LOCAL_SETUP.md              # Non-Docker setup guide
├── RAILWAY.md                  # Cloud deployment guide
├── .gitignore
└── .env.example (root)
```

---

## 🗄️ Database Schema

### Tables

#### `complaints`
```sql
id UUID PRIMARY KEY,
complaint_text TEXT NOT NULL,
location_text TEXT,
image_url TEXT,
status VARCHAR(32) DEFAULT 'RECEIVED',  -- RECEIVED, SENSED, CLASSIFIED, COMPLETED
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
```

#### `classifications`
```sql
id UUID PRIMARY KEY,
complaint_id UUID FOREIGN KEY REFERENCES complaints(id),
category VARCHAR(64),  -- Infrastructure Damage, Public Transport, Healthcare, etc.
agency VARCHAR(64),    -- DBKL, APAD, KKM, OTHER
confidence DOUBLE PRECISION,  -- 0.0 to 1.0
raw_json JSONB,        -- Full LLM response
created_at TIMESTAMPTZ DEFAULT NOW()
```

#### `work_orders`
```sql
id UUID PRIMARY KEY,
complaint_id UUID FOREIGN KEY REFERENCES complaints(id),
agency VARCHAR(64),
priority VARCHAR(16),  -- LOW, MEDIUM, HIGH
description TEXT,
status VARCHAR(32) DEFAULT 'CREATED',
created_at TIMESTAMPTZ DEFAULT NOW()
```

#### `audit_logs`
```sql
id UUID PRIMARY KEY,
complaint_id UUID,
event_type VARCHAR(64),  -- COMPLAINT_RECEIVED, SENSE_COMPLETED, AGENCY_ROUTED, etc.
message TEXT,
payload JSONB,
created_at TIMESTAMPTZ DEFAULT NOW()
```

---

## 🌍 External Integrations

### api.data.gov.my
- **Dataset**: Fuel Price (`fuelprice`)
- **URL**: `https://api.data.gov.my/data-catalogue?id=fuelprice`
- **Purpose**: Data enrichment in audit logs
- **Fallback**: If API unreachable, logs error but continues processing

### Groq API (Optional)
- **Model**: `llama-3.1-70b-versatile`
- **Purpose**: Intelligent complaint classification
- **Fallback**: Built-in heuristic classifier if API key not set
- **Setup**: Set `GROQ_API_KEY` in `.env`

---

## 🚢 Deployment

### Railway (Recommended)
See [RAILWAY.md](./RAILWAY.md) for step-by-step cloud deployment.

**Key Steps:**
1. Create Railway project
2. Add PostgreSQL plugin
3. Deploy backend service (root: `backend`)
4. Deploy frontend service (root: `frontend`)
5. Set environment variables in Railway dashboard

### Docker
```bash
docker compose up -d
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Manual Server Deployment
1. Install Python, Node.js, PostgreSQL
2. Clone repository
3. Follow Local Development setup
4. Use systemd/supervisord for process management
5. Configure reverse proxy (Nginx/Apache)

---

## 📊 Classification Examples

### Input: "Bus broke down at LRT station"
```
Category: Public Transport Issue
Agency: APAD
Confidence: 0.78
```

### Input: "Pothole on Jalan Merdeka"
```
Category: Infrastructure Damage
Agency: DBKL
Confidence: 0.79
```

### Input: "Hospital appointment delay"
```
Category: Healthcare Service
Agency: KKM
Confidence: 0.80
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add feature description"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

### Code Standards
- **Backend**: Follow PEP 8, use type hints
- **Frontend**: Use TypeScript, follow ESLint rules
- **Commits**: Clear, descriptive messages

---

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

---

## 👥 Support & Contact

- **Issues**: GitHub Issues
- **Email**: syukridinup@gmail.com
- **Documentation**: See LOCAL_SETUP.md and RAILWAY.md

---

## 🎯 Roadmap

- [ ] Unit tests (pytest + Jest)
- [ ] Performance optimization
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] WebSocket for real-time updates
- [ ] Advanced analytics (Power BI integration)
- [ ] Blockchain audit trail

---

**Made with ❤️ for Malaysian Government Services**

