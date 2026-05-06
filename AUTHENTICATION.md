# SISPAA Authentication & Worker Management

## Overview

The SISPAA system now includes comprehensive user authentication, role-based access control (RBAC), and a worker dashboard for managing assigned complaints.

## Features

### 1. User Authentication

**Endpoints:**
- `POST /auth/register` - Create new worker account
- `POST /auth/login` - Authenticate and receive JWT token
- `GET /auth/me` - Get current authenticated user

**Security:**
- PBKDF2-SHA256 password hashing with 100k iterations
- JWT tokens with 24-hour expiration
- Role-based access control (admin, supervisor, worker)
- Token required for protected endpoints via `Authorization: Bearer <token>` header

### 2. User Roles

| Role | Permissions | Access |
|------|-------------|--------|
| **admin** | Full system access, manage users, assign work orders | All endpoints |
| **supervisor** | Manage workers, assign/reassign work orders | Dashboard, worker endpoints |
| **worker** | View assigned work orders, update status, complete tasks | Worker dashboard, my work orders |

### 3. Worker Dashboard

**Components:**
- Dashboard metrics (assigned count, pending in agency, completed)
- My work orders table with status tracking
- Work order assignment management
- Task completion tracking

**Endpoints:**
- `GET /worker/dashboard` - Get dashboard metrics
- `GET /worker/my-work-orders` - List my assigned work orders
- `GET /worker/pending-work-orders` - List unassigned work orders (admin/supervisor)
- `POST /worker/assign/{work_order_id}` - Assign work order to worker
- `POST /worker/complete/{work_order_id}` - Mark work order as completed

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(32) DEFAULT 'worker',  -- admin, supervisor, worker
    agency VARCHAR(64),                  -- DBKL, APAD, KKM
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    INDEXES: (username, email)
);
```

### Updated Work Orders

```sql
ALTER TABLE work_orders ADD COLUMN:
    - assigned_to UUID (nullable) -- User ID of assigned worker
    - assigned_by UUID (nullable) -- User ID of assigner
    - assigned_at TIMESTAMP (nullable)
    - completed_at TIMESTAMP (nullable)
```

## Frontend Implementation

### Login Page (`/auth/login`)
- Form with username and password fields
- Stores JWT token in localStorage
- Redirects to worker dashboard on success

### Register Page (`/auth/register`)
- Form with username, email, password, full_name, agency
- Default role: "worker"
- Creates account and auto-logs in

### Worker Dashboard (`/worker/dashboard`)
- KPI cards showing:
  - Complaints assigned to me
  - Pending complaints in my agency
  - Completed complaints by me
- Work orders table with status filters
- Quick actions for status updates

## API Client Usage

```typescript
// Authentication
import { loginUser, getCurrentUser, getWorkerDashboard } from "@/lib/api";

// Login
const { access_token, user_id, role } = await loginUser(username, password);
localStorage.setItem("token", access_token);

// Get current user
const user = await getCurrentUser();

// Get dashboard data
const dashboard = await getWorkerDashboard();
```

## Backend Implementation

### Authentication Service (`backend/app/services/auth.py`)

```python
from app.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)

# Hash password for storage
hash = hash_password("user_password")

# Verify on login
is_valid = verify_password("user_password", hash)

# Create JWT token
token = create_access_token(user_id, role, agency)

# Validate token
payload = decode_access_token(token)
```

### User Model (`backend/app/db/user_models.py`)

```python
from app.db.user_models import User

# User fields:
# - id: UUID primary key
# - username: Unique, max 64 chars
# - email: Unique, max 255 chars
# - password_hash: PBKDF2 hash
# - full_name: Optional, max 255 chars
# - role: admin, supervisor, or worker (default)
# - agency: DBKL, APAD, KKM, or custom
# - is_active: Boolean flag for account status
# - created_at: Timestamp
```

### Auth Routes (`backend/app/api/auth_routes.py`)

```python
# POST /auth/register
# Body: { username, email, password, full_name?, agency? }
# Response: { access_token, token_type, user_id, role, agency }

# POST /auth/login
# Body: { username, password }
# Response: { access_token, token_type, user_id, role, agency }

# GET /auth/me
# Headers: Authorization: Bearer <token>
# Response: UserOut model with all user details

# GET /auth/workers
# Headers: Authorization: Bearer <token>
# Response: List[UserOut] - all users (admin only)
```

### Worker Routes (`backend/app/api/worker_routes.py`)

```python
# GET /worker/dashboard
# Returns: { assigned_to_me, pending_in_agency, completed_by_me }

# GET /worker/my-work-orders
# Returns: List[WorkOrderOut] - sorted by created_at desc

# GET /worker/pending-work-orders
# Returns: List[WorkOrderOut] with complaint details

# POST /worker/assign/{work_order_id}
# Body: { assign_to_user_id }
# Returns: Updated work order

# POST /worker/complete/{work_order_id}
# Returns: Updated work order with completed_at
```

## Work Order Status Flow

```
PENDING → IN_PROGRESS → COMPLETED
   ↓
ASSIGNED (intermediate)
```

**Status Definitions:**
- **PENDING**: Work order created, waiting for assignment
- **IN_PROGRESS**: Work order assigned to worker, actively being handled
- **COMPLETED**: Work order finished and closed

## Environment Variables

Backend requires:
```bash
# .env or environment
DATABASE_URL=postgresql+asyncpg://user:password@localhost/sispaa_router
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
JWT_SECRET=your-secret-key  # TODO: Move hardcoded "secret-key" to env
```

Frontend requires:
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Installation & Setup

### Backend Setup

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Start PostgreSQL database:
```bash
psql -U postgres -d sispaa_router
```

3. Run backend:
```bash
python -m uvicorn app.main:app --reload
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start dev server:
```bash
npm run dev
```

3. Access at `http://localhost:3001/auth/login`

## Security Checklist

- [x] Password hashing (PBKDF2)
- [x] JWT authentication
- [x] Role-based access control
- [ ] Move JWT secret to environment variable
- [ ] Add password complexity requirements
- [ ] Add rate limiting on auth endpoints
- [ ] Add refresh token support
- [ ] Add HTTPS in production
- [ ] Add token expiration to work order responses
- [ ] Audit log user actions (who assigned, who completed)

## Testing

### Test User Accounts

Create test users via `/auth/register`:

1. **Admin User**
   - Username: `admin`
   - Password: `SecurePass123!`
   - Role: admin (manual database update)

2. **Supervisor**
   - Username: `supervisor1`
   - Password: `SecurePass123!`
   - Agency: DBKL

3. **Worker**
   - Username: `worker1`
   - Password: `SecurePass123!`
   - Agency: APAD

### API Testing with cURL

```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"worker1","email":"worker@test.com","password":"test12345"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"worker1","password":"test12345"}'

# Get current user
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/auth/me

# Get dashboard
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/worker/dashboard
```

## Next Steps

1. **Database Seeds**: Create default admin user
2. **Frontend Middleware**: Redirect unauthenticated users to login
3. **Rate Limiting**: Prevent brute force attacks on auth endpoints
4. **Audit Logging**: Track all user actions (assign, complete, etc.)
5. **WebSocket Integration**: Real-time work order updates
6. **Integration Tests**: Full end-to-end authentication flow
