# Quick Start: Authentication & Worker Features Testing

## Prerequisites

- Backend running on `http://localhost:8002`
- Frontend running on `http://localhost:3001`
- PostgreSQL database created and accessible

## Step 1: Start Backend

Install the backend dependencies first:

```bash
cd backend
pip install -r requirements.txt
```

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8002
```

If you use a different port, update the frontend/backend URLs in the test steps accordingly.

Backend should create the `users` table automatically on startup via `init_db()`.

## Step 2: Test Registration (cURL)

This is a backend API endpoint, so call it with `POST` using `curl` or the frontend form. For the browser UI, use `http://localhost:3001/auth/register` instead.

```bash
# Create a worker account
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "worker1",
    "email": "worker1@test.com",
    "password": "SecurePass123!",
    "full_name": "John Worker",
    "agency": "DBKL"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "worker",
  "agency": "DBKL"
}
```

**Save the access_token for next steps!**

## Step 3: Test Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "worker1",
    "password": "SecurePass123!"
  }'
```

**Expected Response:** Same as registration (new token)

## Step 4: Test Get Current User

```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "worker1",
  "email": "worker1@test.com",
  "full_name": "John Worker",
  "role": "worker",
  "agency": "DBKL",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00.000000"
}
```

## Step 5: Test Worker Dashboard

First, submit a complaint via POST /complaint to create a work order:

```bash
curl -X POST http://localhost:8000/complaint \
  -H "Content-Type: application/json" \
  -d '{
    "complaint_text": "Pothole in jalan merdeka",
    "location_text": "Jalan Merdeka, KL 50100",
    "image_url": "http://example.com/pothole.jpg"
  }'
```

Then check worker dashboard:

```bash
curl -X GET http://localhost:8000/worker/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected Response:**
```json
{
  "assigned_to_me": 0,
  "pending_in_agency": 1,
  "completed_by_me": 0
}
```

## Step 6: Test Work Order Assignment

First, create another admin/supervisor account to assign work orders:

```bash
# Create admin account
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "supervisor1",
    "email": "supervisor@test.com",
    "password": "SecurePass123!",
    "agency": "DBKL"
  }'
```

**NOTE:** Default role is "worker". To make them admin/supervisor, manually update database:
```sql
UPDATE users SET role = 'supervisor' WHERE username = 'supervisor1';
```

Get pending work orders:
```bash
curl -X GET http://localhost:8000/worker/pending-work-orders \
  -H "Authorization: Bearer <supervisor_token>"
```

Assign work order to worker (replace IDs with actual values):
```bash
curl -X POST http://localhost:8000/worker/assign/550e8400-e29b-41d4-a716-446655440001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <supervisor_token>" \
  -d '{
    "assign_to_user_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

## Step 7: Test Frontend

### 7.1 Navigate to Login Page

```
http://localhost:3001/auth/login
```

### 7.2 Login with Worker Account

- Username: `worker1`
- Password: `SecurePass123!`

Expected: Redirect to `/worker/dashboard`

### 7.3 Check Dashboard

Should see:
- KPI cards with metrics
- Work orders table with assignments
- Status badges (PENDING, IN_PROGRESS, COMPLETED)

### 7.4 Create New Account

Click "Register here" → Fill form → Submit

Expected: Auto-login and redirect to dashboard

## Troubleshooting

### Issue: "Invalid token" when accessing protected endpoints

**Solution:**
- Ensure token hasn't expired (24 hour expiration)
- Check token format: `Authorization: Bearer <token>` (case-sensitive)
- Verify `Authorization` header is being sent

### Issue: User table not created

**Solution:**
1. Check PostgreSQL database exists: `sispaa_router`
2. Delete database and recreate:
   ```bash
   psql -U postgres -c "DROP DATABASE sispaa_router;"
   psql -U postgres -c "CREATE DATABASE sispaa_router;"
   ```
3. Restart backend (should auto-create tables)

### Issue: 400 Bad Request on register

**Solution:**
- Check email is valid format
- Username must be 3-64 characters
- Password must be 8+ characters
- Email must be unique

### Issue: CORS errors in browser console

**Solution:**
- Check `CORS_ORIGINS` in backend `.env`
- Should be: `http://localhost:3000,http://localhost:3001`
- Restart backend after changing

## Testing Work Order Status Updates

### Test Complete Work Order

```bash
# Worker completes their assigned work order
curl -X POST http://localhost:8000/worker/complete/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer <worker_token>"
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "COMPLETED",
  "completed_at": "2024-01-15T11:30:00.000000"
}
```

### Verify in Dashboard

```bash
curl -X GET http://localhost:8000/worker/dashboard \
  -H "Authorization: Bearer <worker_token>"
```

**Expected:** `completed_by_me` should increment to 1

## API Endpoint Summary

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| POST | /auth/register | No | - | Create account |
| POST | /auth/login | No | - | Get token |
| GET | /auth/me | Yes | Any | Get current user |
| GET | /auth/workers | Yes | Admin | List all users |
| GET | /worker/dashboard | Yes | Any | Dashboard metrics |
| GET | /worker/my-work-orders | Yes | Worker | My assignments |
| GET | /worker/pending-work-orders | Yes | Supervisor | Unassigned |
| POST | /worker/assign/{id} | Yes | Supervisor | Assign to worker |
| POST | /worker/complete/{id} | Yes | Worker | Complete task |

## Performance Notes

- User registration: ~200ms (password hashing with 100k iterations)
- Login: ~200ms (password verification)
- Dashboard queries: ~50ms (aggregation queries)
- Work order assignment: ~100ms (3 DB updates)

If endpoints are slower, check:
1. PostgreSQL connection pool (asyncpg)
2. Network latency (localhost should be fast)
3. Backend CPU usage (password hashing is CPU-intensive)

## Security Testing

### Test Invalid Credentials

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "worker1", "password": "WrongPassword"}'
```

**Expected:** 401 Unauthorized

### Test Expired Token

Tokens expire in 24 hours. To test quickly, edit `backend/app/services/auth.py`:
```python
# Change expires_in_hours from 24 to 0.001 (1.4 seconds)
```

Then test same endpoint after 2 seconds - should get 401.

### Test Missing Token

```bash
curl -X GET http://localhost:8000/worker/dashboard
```

**Expected:** 401 Unauthorized "Missing or invalid token"

## Next: Production Checklist

- [ ] Move JWT secret to environment variable
- [ ] Add password complexity validation
- [ ] Add rate limiting (redis + slowapi)
- [ ] Add refresh token support
- [ ] Switch from localStorage to httpOnly cookies
- [ ] Add audit logging for all actions
- [ ] Add email verification for new accounts
- [ ] Enable HTTPS in production
- [ ] Add API rate limiting
