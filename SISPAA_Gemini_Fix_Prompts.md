# SISPAA Intelligent — Gemini Fix & Test Prompts
**Project:** SISPAA Intelligent GovTech Router  
**Repo:** https://github.com/syukri1995/SISPAA-Intelligent  
**Purpose:** Paste each prompt below into Gemini (with code context attached where noted). Run them in order — each fix builds on the previous one.

---

## HOW TO USE THESE PROMPTS

1. Clone the repo locally first: `git clone https://github.com/syukri1995/SISPAA-Intelligent.git`
2. For each prompt, open the file(s) listed under **"Attach these files"** and paste their contents into Gemini alongside the prompt text.
3. Apply the returned code to the repo.
4. Run the test command listed at the end of each prompt to verify the fix.
5. Proceed to the next prompt only after the test passes.

---

---

# PROMPT 1 — Fix: WorkOrder status mismatch (CRITICAL)

## Context
Paste the contents of these three files into Gemini before this prompt:
- `backend/app/api/routes.py`
- `backend/app/db/models.py`
- `backend/schema.sql`

## Prompt

```
You are fixing a critical bug in a FastAPI + SQLAlchemy + PostgreSQL project called SISPAA Intelligent.

## THE BUG

There is a fatal status mismatch across three files that causes work orders to never appear in the worker queue:

1. `backend/app/db/models.py` — WorkOrder model default is `"PENDING"` (line 55)
2. `backend/app/api/routes.py` — WorkOrder is inserted with hardcoded `status="CREATED"` (line 93)
3. `backend/schema.sql` — SQL DDL says `DEFAULT 'CREATED'` for work_orders.status

The worker dashboard in `backend/app/api/worker_routes.py` queries:
  `WorkOrder.status == "PENDING"`

So any work order created via the API is saved as "CREATED" but the worker queue filters on "PENDING", meaning workers never see any work orders.

## YOUR TASK

Fix all three files to use a single canonical status value. Use "PENDING" as the canonical initial status.

### Fix 1 — `backend/app/api/routes.py`

Find this block:
```python
work_order = WorkOrder(
    id=str(state_out.get("work_order_id")),
    complaint_id=complaint.id,
    agency=str(state_out.get("agency", "OTHER")),
    priority=str(state_out.get("priority", "LOW")),
    description=str(state_out.get("work_order_description", "")),
    status="CREATED",
)
```

Remove `status="CREATED"` entirely. Let the model default take effect (which is already "PENDING").

### Fix 2 — `backend/schema.sql`

Find:
```sql
status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
```
Under the `work_orders` table. Change it to:
```sql
status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
```

### Fix 3 — `backend/app/db/models.py`

The WorkOrder status column comment says `# PENDING, IN_PROGRESS, COMPLETED`. Verify the default is `"PENDING"` and add a new comment line explaining the full lifecycle:
```python
status: Mapped[str] = mapped_column(
    String(32), nullable=False, default="PENDING"
)  # Lifecycle: PENDING → IN_PROGRESS → COMPLETED
```

Return the complete corrected content of all three files.

## TEST COMMAND

After applying the fix, run this curl sequence to verify:

```bash
# 1. Submit a complaint
curl -s -X POST http://localhost:8000/complaint \
  -H "Content-Type: application/json" \
  -d '{"complaint_text": "Pothole on Jalan Merdeka near the roundabout"}' \
  | python3 -m json.tool

# 2. Note the work_order_id from step 1, then check worker pending queue
# (login as a supervisor first to get a token)
curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "supervisor1", "password": "yourpassword"}' \
  | python3 -m json.tool

# 3. Use the returned token to check pending work orders
curl -s http://localhost:8000/worker/pending-work-orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  | python3 -m json.tool

# EXPECTED: The new work order appears in the pending list with status "PENDING"
# FAIL if: Empty list returned, or work order has status "CREATED"
```
```

---

---

# PROMPT 2 — Fix: Duplicate UserUpdate schema declaration (REDUNDANCY)

## Context
Attach these files:
- `backend/app/api/auth_routes.py`
- `backend/app/schemas/user.py`

## Prompt

```
You are cleaning up a duplicate class definition in a FastAPI project called SISPAA Intelligent.

## THE PROBLEM

`UserUpdate` is defined twice:

**Location 1 — `backend/app/schemas/user.py` (the correct canonical location):**
```python
class UserUpdate(BaseModel):
    role: str | None = Field(default=None, description="User role: admin, supervisor, worker, or public")
    agency: str | None = Field(default=None, max_length=64)
```

**Location 2 — `backend/app/api/auth_routes.py` lines 18–21 (the duplicate):**
```python
class UserUpdate(BaseModel):
    """Schema for updating user role and agency."""
    role: str | None = None
    agency: str | None = None
```

The import line on line 12 already imports `UserUpdate` from schemas:
```python
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserOut, UserUpdate
```

But then lines 18–21 immediately redefine it, silently shadowing the import. This means the version with `Field(max_length=64)` validation is never used for the update endpoint.

## YOUR TASK

1. Delete lines 18–21 from `backend/app/api/auth_routes.py` (the local `class UserUpdate(BaseModel)` redefinition).
2. Keep the import from `app.schemas.user` intact.
3. Also fix the duplicate import on line 12 — it currently imports `UserRegister, UserLogin, TokenResponse, UserOut` twice across two consecutive lines. Merge into a single import statement.

Return the complete corrected `auth_routes.py`.

## TEST COMMAND

```bash
# Start the backend and run:
cd backend
python -m pytest tests/ -v -k "auth" 2>&1 || echo "No pytest yet — doing manual check"

# Manual check — verify the update endpoint rejects a too-long agency string
curl -s -X PUT http://localhost:8000/auth/users/SOME_USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agency": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"}' \
  | python3 -m json.tool

# EXPECTED: 422 Unprocessable Entity (because agency exceeds max_length=64)
# FAIL if: 200 OK returned (means the canonical schema with Field validation is still being shadowed)
```
```

---

---

# PROMPT 3 — Fix: Open admin self-registration (CRITICAL SECURITY)

## Context
Attach these files:
- `backend/app/api/auth_routes.py`
- `backend/app/schemas/user.py`
- `backend/app/core/constants.py`

## Prompt

```
You are fixing a critical security vulnerability in SISPAA Intelligent, a FastAPI application.

## THE VULNERABILITY

The `/auth/register` endpoint accepts a `role` field directly from the request body and persists it to the database with NO restriction. This means ANY anonymous user can POST:

```json
{
  "username": "hacker",
  "email": "hacker@example.com", 
  "password": "password123",
  "role": "admin"
}
```

...and instantly have full admin access. There is no check that only an existing admin can elevate a role.

## YOUR TASK — THREE CHANGES

### Change 1 — `backend/app/schemas/user.py`

In `UserRegister`, change the `role` field so it always defaults to `"public"` and CANNOT be set to `"admin"` or `"supervisor"` by the caller. Remove `"admin"` and `"supervisor"` from the allowed values on self-registration:

```python
class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(min_length=8, max_length=255)
    full_name: str | None = Field(default=None, max_length=255)
    agency: str | None = Field(default=None, max_length=64)
    # Role is ALWAYS forced to "public" on self-registration.
    # Admins use PATCH /auth/users/{id} to elevate roles after registration.
    role: str = Field(default="public", exclude=True)  # excluded from input
```

Actually — do NOT use `exclude=True` as that removes it from output too. Instead, use a validator that overrides whatever the user sends:

```python
    role: str = Field(default="public")

    @field_validator("role", mode="before")
    @classmethod
    def force_public_role(cls, v: str) -> str:
        """Self-registration always creates a public user.
        Role elevation is done by admins via PATCH /auth/users/{id}."""
        return "public"
```

### Change 2 — `backend/app/api/auth_routes.py`

In the `/register` endpoint, remove the role validation block that currently allows any role:

```python
# DELETE this block:
if payload.role not in VALID_ROLES:
    raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")
```

Replace it with a comment:
```python
# Role is always "public" on self-registration (enforced by UserRegister schema validator).
# Use PUT /auth/users/{id} (admin only) to assign elevated roles.
```

### Change 3 — `backend/app/api/auth_routes.py`

Update the docstring of the register endpoint from:
```python
"""Register a new worker/admin user."""
```
to:
```python
"""Register a new public user. Role elevation (worker/supervisor/admin) is done by admins via PUT /auth/users/{id}."""
```

Return the complete corrected versions of both files.

## TEST COMMANDS

```bash
# Test 1: Self-registration as admin should be BLOCKED (role forced to "public")
curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testadmin",
    "email": "testadmin@example.com",
    "password": "securepass123",
    "role": "admin"
  }' | python3 -m json.tool

# EXPECTED: 200 OK but returned role should be "public", NOT "admin"
# FAIL if: role in response is "admin" or "supervisor"

# Test 2: Normal registration works fine
curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "normaluser",
    "email": "normal@example.com",
    "password": "securepass123"
  }' | python3 -m json.tool

# EXPECTED: 200 OK with role: "public"

# Test 3: Admin can still elevate a user's role via PUT
# (Login as existing admin first, get token, then:)
curl -s -X PUT http://localhost:8000/auth/users/USER_ID_FROM_TEST_1 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "worker", "agency": "DBKL"}' \
  | python3 -m json.tool

# EXPECTED: 200 OK with updated role "worker"
```
```

---

---

# PROMPT 4 — Fix: Middleware reads role from spoofable header instead of JWT (CRITICAL SECURITY)

## Context
Attach these files:
- `frontend/middleware.ts`
- `frontend/package.json`

## Prompt

```
You are fixing a security vulnerability in the Next.js 14 frontend of SISPAA Intelligent.

## THE VULNERABILITY

The `getUserRole()` function in `frontend/middleware.ts` reads the user's role from a custom HTTP header `x-user-role`:

```typescript
function getUserRole(req: NextRequest): string | null {
  try {
    const token = req.cookies.get("sispaa_token")?.value;
    if (!token) return null;
    // Extract role from localStorage (stored in HTTP header or cookie)
    // For now, we'll rely on localStorage from frontend
    // In a real app, you'd decode the JWT here
    return req.headers.get("x-user-role") || null;
  } catch {
    return null;
  }
}
```

This means ANY user can bypass admin route protection by adding `x-user-role: admin` to their request headers. The admin check on `/admin/*` routes is therefore completely bypassable.

## THE JWT STRUCTURE

The backend (`backend/app/services/auth.py`) creates tokens with this payload:
```python
class TokenPayload(BaseModel):
    sub: str       # user_id
    role: str      # "admin", "supervisor", "worker", "public"
    agency: str | None = None
    exp: int
```

JWT secret is `settings.jwt_secret_key` (HS256 algorithm). In the frontend middleware (Edge Runtime), we cannot use Node.js `crypto` directly, but `jose` is Edge-compatible.

## YOUR TASK

### Step 1: Install jose
Add to `frontend/package.json` dependencies (if not present):
```json
"jose": "^5.2.3"
```

### Step 2: Rewrite `frontend/middleware.ts`

Replace the entire file with this secure version:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_TOKEN_COOKIE = "sispaa_token";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || "secret-key-change-in-production"
);

interface JWTPayload {
  sub: string;
  role: string;
  agency?: string | null;
  exp: number;
}

async function getTokenPayload(req: NextRequest): Promise<JWTPayload | null> {
  try {
    const token = req.cookies.get(AUTH_TOKEN_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const tokenPayload = await getTokenPayload(req);
  const authed = tokenPayload !== null;
  const userRole = tokenPayload?.role ?? null;

  // Redirect unauthenticated users away from protected pages
  if (!authed && !pathname.startsWith("/auth")) {
    const publicPages = ["/", "/submit", "/auth/login", "/auth/register"];
    if (!publicPages.includes(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect /admin routes — must be authenticated AND have role "admin"
  if (pathname.startsWith("/admin")) {
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  // Protect /worker routes — must be authenticated and have role worker/supervisor/admin
  if (pathname.startsWith("/worker")) {
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    const workerRoles = ["worker", "supervisor", "admin"];
    if (!workerRoles.includes(userRole ?? "")) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  // Redirect already-logged-in users away from auth pages
  if (pathname.startsWith("/auth") && authed) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Redirect root
  if (pathname === "/") {
    return NextResponse.redirect(
      authed
        ? new URL("/dashboard", req.nextUrl)
        : new URL("/auth/login", req.nextUrl)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/worker/:path*", "/admin/:path*", "/auth/:path*", "/dashboard", "/submit", "/status"],
};
```

### Step 3: Add JWT_SECRET_KEY to frontend environment

Add to `frontend/.env.local`:
```
JWT_SECRET_KEY=your-actual-secret-key-here
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Return the complete corrected `middleware.ts` and the `npm install` command to run.

## TEST COMMANDS

```bash
# Install jose first
cd frontend && npm install jose

# Test 1: Attempt to bypass admin check with spoofed header
# This should FAIL (redirect to /dashboard, not reach /admin)
curl -s -o /dev/null -w "%{http_code}" \
  -H "x-user-role: admin" \
  -H "Cookie: sispaa_token=FAKE_TOKEN" \
  http://localhost:3001/admin

# EXPECTED: 307 redirect to /auth/login (not /admin content)
# FAIL if: 200 or content from /admin is returned

# Test 2: Real admin JWT should still reach /admin
# Login as admin, get real token, then:
curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: sispaa_token=REAL_ADMIN_JWT" \
  http://localhost:3001/admin/users

# EXPECTED: 200
```
```

---

---

# PROMPT 5 — Fix: Dead code — RolePermissions and require_role never used (REDUNDANCY)

## Context
Attach these files:
- `backend/app/core/constants.py`
- `backend/app/core/dependencies.py`
- `backend/app/api/worker_routes.py`

## Prompt

```
You are refactoring SISPAA Intelligent to replace ad-hoc role checks with the existing but unused RBAC system.

## THE PROBLEM

A full RBAC system exists in `backend/app/core/constants.py` (`RolePermissions` class) and `backend/app/core/dependencies.py` (`require_role` decorator, `get_current_user_with_role`).

However, ALL actual role checks in `backend/app/api/worker_routes.py` ignore this system and use raw string comparisons:

```python
# Example of the ad-hoc checks currently in worker_routes.py:
if user.role not in [UserRole.WORKER.value, UserRole.SUPERVISOR.value, UserRole.ADMIN.value]:
    raise HTTPException(status_code=403, detail="Insufficient permissions")

if user.role not in [UserRole.SUPERVISOR.value, UserRole.ADMIN.value]:
    raise HTTPException(status_code=403, detail="Supervisors and admins only")
```

## YOUR TASK

Refactor `backend/app/api/worker_routes.py` to use the `get_current_user` dependency combined with inline `UserRole` enum checks (since the `require_role` decorator has a design flaw — it injects `user` as a kwarg which conflicts with FastAPI's dependency injection system). Clean up the checks to be consistent and readable.

Specifically, replace each `if user.role not in [...]` block with a helper function defined at the top of the file:

```python
def _require_roles(user: User, *roles: UserRole) -> None:
    """Raise 403 if user's role is not in the allowed set."""
    if UserRole(user.role) not in set(roles):
        raise HTTPException(
            status_code=403,
            detail=f"Required role(s): {', '.join(r.value for r in roles)}"
        )
```

Then replace all ad-hoc checks in the endpoints:

```python
# worker_dashboard endpoint:
_require_roles(user, UserRole.WORKER, UserRole.SUPERVISOR, UserRole.ADMIN)

# pending_work_orders endpoint:
_require_roles(user, UserRole.SUPERVISOR, UserRole.ADMIN)

# assign_work_order endpoint:
_require_roles(user, UserRole.SUPERVISOR, UserRole.ADMIN)
```

Also, add a comment to `backend/app/core/dependencies.py` at the top of `require_role` explaining why it is not yet used in routes (FastAPI DI kwarg injection conflict) and what the intended usage pattern is, so future developers don't wonder why it exists.

Return the complete corrected `worker_routes.py` and the updated comment in `dependencies.py`.

## TEST COMMANDS

```bash
# Test 1: Worker cannot access pending work orders (supervisor/admin only)
curl -s http://localhost:8000/worker/pending-work-orders \
  -H "Authorization: Bearer WORKER_ROLE_TOKEN" \
  | python3 -m json.tool

# EXPECTED: {"detail": "Required role(s): supervisor, admin"}  (403 status)

# Test 2: Worker CAN access their own work orders
curl -s http://localhost:8000/worker/my-work-orders \
  -H "Authorization: Bearer WORKER_ROLE_TOKEN" \
  | python3 -m json.tool

# EXPECTED: 200 with list (even if empty)

# Test 3: Supervisor CAN access pending work orders
curl -s http://localhost:8000/worker/pending-work-orders \
  -H "Authorization: Bearer SUPERVISOR_ROLE_TOKEN" \
  | python3 -m json.tool

# EXPECTED: 200 with list
```
```

---

---

# PROMPT 6 — Fix: Work Orders page shows complaints data, not work orders (REDUNDANCY)

## Context
Attach these files:
- `frontend/app/work-orders/page.tsx`
- `frontend/lib/api.ts`
- `frontend/types/complaint.ts` (if it exists)
- `backend/app/api/worker_routes.py`

## Prompt

```
You are fixing a mislabelled page in the SISPAA Intelligent Next.js 14 frontend.

## THE PROBLEM

The page at `/work-orders` (`frontend/app/work-orders/page.tsx`) is titled "Work Orders" but:
1. It calls `getRecentComplaints()` which hits `GET /complaints/recent`
2. It renders a `ComplaintTable` component with complaint columns (category, agency, confidence)
3. Work order specific fields (priority, assigned_to, status, description) are ABSENT

The backend has a proper endpoint for this: `GET /worker/pending-work-orders` which returns:
```json
[{
  "id": "...",
  "complaint_id": "...",
  "complaint_text": "...",
  "category": "...",
  "agency": "...",
  "priority": "LOW|MEDIUM|HIGH",
  "description": "...",
  "status": "PENDING|IN_PROGRESS|COMPLETED",
  "created_at": "..."
}]
```

## YOUR TASK

### Step 1 — Add `getWorkOrders()` to `frontend/lib/api.ts`

Add this function:
```typescript
export async function getWorkOrders(limit = 50) {
  const r = await fetch(`${baseUrl}/worker/pending-work-orders`, {
    headers: { ...getAuthHeaders() },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}
```

### Step 2 — Rewrite `frontend/app/work-orders/page.tsx`

Replace the entire file with a proper work orders page that:
- Fetches from the correct `/worker/pending-work-orders` endpoint
- Shows a table with columns: Priority (with colour badge), Agency, Description (truncated), Status, Created At
- Handles the unauthenticated case with a redirect to `/auth/login`
- Uses Tailwind classes consistent with the existing project style

Here is the new page:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWorkOrders } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

interface WorkOrderRow {
  id: string;
  complaint_id: string;
  complaint_text: string | null;
  category: string | null;
  agency: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  status: string;
  created_at: string | null;
}

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-100 text-red-800 font-medium",
  MEDIUM: "bg-yellow-100 text-yellow-800 font-medium",
  LOW: "bg-green-100 text-green-800 font-medium",
};

export default function WorkOrdersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<WorkOrderRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    (async () => {
      try {
        const data = await getWorkOrders();
        setRows(data);
      } catch (e: any) {
        setError("Failed to load work orders.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const filtered = rows.filter(
    (r) =>
      !query ||
      r.agency.toLowerCase().includes(query.toLowerCase()) ||
      r.description.toLowerCase().includes(query.toLowerCase()) ||
      (r.category ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Work Orders</h1>
        <p className="text-gray-600">Pending and active work orders across all agencies</p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by agency, category, or description..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-300"
        />
      </div>

      {loading && <div className="text-slate-500 text-sm">Loading work orders...</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Priority</th>
                <th className="text-left px-4 py-3 font-medium">Agency</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center px-4 py-8 text-slate-400">
                    No work orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${PRIORITY_STYLES[row.priority] ?? ""}`}>
                        {row.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{row.agency}</td>
                    <td className="px-4 py-3 text-slate-600">{row.category ?? "—"}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-700">{row.description}</td>
                    <td className="px-4 py-3 text-slate-600">{row.status}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

Return the complete corrected `work-orders/page.tsx` and the updated `lib/api.ts`.

## TEST COMMANDS

```bash
# Start frontend (npm run dev in /frontend)
# Navigate to http://localhost:3001/work-orders while logged in as worker/supervisor/admin

# API-level test:
curl -s http://localhost:8000/worker/pending-work-orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | python3 -m json.tool

# EXPECTED: JSON array of work orders with priority, agency, status fields
# FAIL if: The page shows confidence/classification columns instead of priority/status
```
```

---

---

# PROMPT 7 — Fix: Complaint status overloading — "COMPLETED" means two different things (REDUNDANCY)

## Context
Attach these files:
- `backend/app/api/routes.py`
- `backend/app/api/worker_routes.py`
- `backend/app/db/models.py`

## Prompt

```
You are fixing an overloaded status value in SISPAA Intelligent's complaint lifecycle.

## THE PROBLEM

`complaint.status = "COMPLETED"` is set in TWO different places with completely different meanings:

**Location 1 — `backend/app/api/routes.py` line 97:**
Set immediately after the LangGraph AI workflow finishes and a work order is created. At this point, NO human worker has looked at the complaint. "COMPLETED" here means "AI processing done".

**Location 2 — `backend/app/api/worker_routes.py` in `complete_work_order()`:**
Set when a human worker marks the work order as resolved. This is the REAL completion.

This causes two problems:
1. The metrics endpoint shows 100% "auto-resolved" the moment a complaint is submitted, even though no human has handled it.
2. The "pending_cases" metric counts complaints not yet "COMPLETED" — but ALL complaints immediately become "COMPLETED" in routes.py, so pending_cases is always 0.

## THE COMPLAINT LIFECYCLE

Correct lifecycle should be:
```
RECEIVED → SENSED → CLASSIFIED → ROUTED → COMPLETED
```
Where ROUTED = "AI done, work order created, handed to workers"
And COMPLETED = "Human worker resolved the case"

## YOUR TASK

### Change 1 — `backend/app/db/models.py`

Update the Complaint status comment:
```python
status: Mapped[str] = mapped_column(String(32), nullable=False, default="RECEIVED")
# Lifecycle: RECEIVED → SENSED → CLASSIFIED → ROUTED → COMPLETED
# ROUTED = work order created and assigned to agency
# COMPLETED = human worker resolved the case
```

### Change 2 — `backend/app/api/routes.py`

In the `submit_complaint` endpoint, find:
```python
complaint.status = "COMPLETED"
```
Change it to:
```python
complaint.status = "ROUTED"
```

This is line 97, inside the try block after the work order is persisted.

### Change 3 — `backend/app/api/routes.py` — metrics endpoint

The metrics endpoint currently counts:
```python
pending_q = select(func.count(Complaint.id)).where(Complaint.status != "COMPLETED")
```

Update it to count complaints that have not been COMPLETED by a human:
```python
pending_q = select(func.count(Complaint.id)).where(
    Complaint.status.in_(["RECEIVED", "SENSED", "CLASSIFIED", "ROUTED"])
)
```

Also add a new metric for `routed_cases` (work orders created, awaiting human action):
```python
routed_q = select(func.count(Complaint.id)).where(Complaint.status == "ROUTED")
routed = (await session.execute(routed_q)).scalar_one()
```

And include it in the return dict:
```python
return {
    "total_complaints_today": int(total_today),
    "pending_cases": int(pending),
    "routed_cases": int(routed),
    "auto_resolved_pct": round(auto_resolved_pct, 1),
    "avg_response_time_minutes": None,
}
```

Return the complete corrected `routes.py`.

## TEST COMMANDS

```bash
# Submit a complaint
curl -s -X POST http://localhost:8000/complaint \
  -H "Content-Type: application/json" \
  -d '{"complaint_text": "Broken streetlight near Masjid Jamek LRT station"}' \
  | python3 -m json.tool

# EXPECTED: response shows status "ROUTED" (not "COMPLETED")

# Check metrics immediately after submission
curl -s http://localhost:8000/metrics | python3 -m json.tool

# EXPECTED:
# pending_cases: 1 (complaint is now ROUTED, not COMPLETED)
# routed_cases: 1
# auto_resolved_pct: 0.0 (nothing is COMPLETED yet)

# Now complete it as a worker, then recheck metrics
# auto_resolved_pct should increase only after a worker closes the case
```
```

---

---

# PROMPT 8 — Fix: Remove unused Redis config (CLEANUP)

## Context
Attach these files:
- `backend/app/core/config.py`
- `docker-compose.yml`

## Prompt

```
You are removing dead configuration from SISPAA Intelligent.

## THE PROBLEM

`backend/app/core/config.py` defines two settings that are never read anywhere in the codebase:

```python
redis_url: str = "redis://localhost:6379/0"
enable_redis_queue: bool = False
```

`docker-compose.yml` likely also includes a Redis service that is never connected to anything.

No file in the backend imports, reads, or uses `settings.redis_url` or `settings.enable_redis_queue`.

## YOUR TASK

### Change 1 — `backend/app/core/config.py`

Remove these two lines from the `Settings` class:
```python
redis_url: str = "redis://localhost:6379/0"
enable_redis_queue: bool = False
```

Add a TODO comment in their place if the team plans to implement queuing later:
```python
# TODO: Add redis_url and enable_redis_queue when background job queue is implemented.
# Planned for: async complaint processing via Celery or ARQ.
```

### Change 2 — `docker-compose.yml`

If `docker-compose.yml` contains a Redis service block, remove it entirely. Return the corrected `docker-compose.yml`.

Return the complete corrected versions of both files.

## TEST COMMANDS

```bash
# Verify the backend still starts without Redis
cd backend
uvicorn app.main:app --reload --port 8000

# EXPECTED: Server starts cleanly with no Redis connection errors
# Also verify no import errors:
python3 -c "from app.core.config import settings; print('OK', settings.app_name)"

# EXPECTED: OK SISPAA Intelligent GovTech Router
# FAIL if: AttributeError or ImportError
```
```

---

---

# PROMPT 9 — Fix: Heuristic retry logic never fires (LOGIC BUG)

## Context
Attach these files:
- `backend/app/services/classifier.py`
- `backend/app/langgraph/graph.py`

## Prompt

```
You are fixing a logic bug in the LangGraph retry mechanism of SISPAA Intelligent.

## THE PROBLEM

The `should_retry()` function in `backend/app/langgraph/graph.py` retries classification if `confidence < 0.7`:

```python
def should_retry(state: RouterState) -> str:
    conf = float(state.get("confidence", 0.0))
    retry_count = int(state.get("retry_count", 0))
    if conf < 0.7 and retry_count < 3:
        return "retry"
    return "act"
```

But the heuristic classifier in `backend/app/services/classifier.py` returns hardcoded confidence scores:
- Public Transport: 0.74–0.78
- Healthcare: 0.76–0.80
- Infrastructure: 0.73–0.79
- Public Facilities: 0.75
- Other: **0.60** ← only this one triggers retry

When Groq is unavailable (heuristic mode), the retry loop:
1. Calls heuristic classifier → gets deterministic result with same confidence
2. Checks: confidence < 0.7? Only for "Other" (0.60)
3. Re-classifies "Other" complaints up to 3 MORE times... getting 0.60 every time
4. After 3 useless retries, proceeds to Act

This wastes processing time and the retries are meaningless since heuristic output is deterministic.

## YOUR TASK

### Change 1 — `backend/app/langgraph/graph.py`

Modify `should_retry()` to skip retries entirely when in heuristic mode. Add a check on the `raw` metadata stored in state:

```python
def should_retry(state: RouterState) -> str:
    conf = float(state.get("confidence", 0.0))
    retry_count = int(state.get("retry_count", 0))
    
    # Check if the classifier used heuristic mode (deterministic — retrying is pointless)
    metadata = state.get("metadata", {})
    classification_raw = metadata.get("classification_raw", {})
    classifier_mode = classification_raw.get("mode", "")
    
    if "heuristic" in classifier_mode:
        # Heuristic results are deterministic. Retrying returns the exact same answer.
        # Skip directly to Act regardless of confidence.
        return "act"
    
    # For LLM (Groq) mode, retry if confidence is low (LLM output is non-deterministic)
    if conf < 0.7 and retry_count < 3:
        return "retry"
    
    return "act"
```

### Change 2 — `backend/app/services/classifier.py`

Update the docstring to document this behaviour:

```python
async def classify_complaint(text: str) -> ClassificationResult:
    """
    Classify a complaint text into a category and route to an agency.

    Uses Groq LLM if GROQ_API_KEY is configured; otherwise uses keyword heuristics.
    
    Mode is stored in result.raw["mode"]:
      - "groq": LLM classification (non-deterministic; retry logic applies)
      - "heuristic": Keyword-based (deterministic; retry logic is skipped)
      - "heuristic-fallback": Groq failed, fell back to heuristic (retry also skipped)
    
    Returns strictly-typed ClassificationResult with category, agency, confidence, raw.
    """
```

Return the complete corrected `graph.py` and the updated docstring in `classifier.py`.

## TEST COMMANDS

```bash
# Test with Groq disabled (no GROQ_API_KEY set)
# Submit a vague complaint that maps to "Other"
curl -s -X POST http://localhost:8000/complaint \
  -H "Content-Type: application/json" \
  -d '{"complaint_text": "something is wrong"}' \
  | python3 -m json.tool

# Check audit logs — there should be NO multiple REASON_COMPLETED events for the same complaint
curl -s http://localhost:8000/logs?limit=20 | python3 -m json.tool

# EXPECTED: 
# - Exactly ONE "REASON_COMPLETED" log entry per complaint
# - retries field in REASON_COMPLETED payload should show retry_count of 1 (no looping)
# FAIL if: Multiple REASON_COMPLETED entries for the same complaint_id
```
```

---

---

# FINAL INTEGRATION TEST — Run after all 9 prompts are applied

## Prompt

```
You are writing an end-to-end integration test script for SISPAA Intelligent after all bug fixes have been applied.

Write a single Python test script `tests/integration_test.py` that:

1. Registers a public user
2. Verifies the registered user has role "public" (not admin)
3. Attempts to register another user with role="admin" — verifies role is forced to "public"
4. Registers a supervisor user via admin PUT endpoint (creates admin first via direct DB or seed)
5. Submits a complaint and verifies:
   - Response contains status "ROUTED" (not "COMPLETED")
   - work_order_id is present
   - priority is one of LOW/MEDIUM/HIGH
6. Checks /metrics and verifies pending_cases > 0, routed_cases > 0
7. Fetches /worker/pending-work-orders as supervisor — verifies the new work order is listed with status "PENDING"
8. Marks the work order complete as a worker
9. Checks /metrics again — verifies auto_resolved_pct has increased and pending_cases decreased
10. Verifies duplicate status route GET /status/{id} and GET /complaint/{id}/status return identical data

Use only Python stdlib + `requests`. No pytest needed. Print PASS/FAIL for each test.

Base URL: http://localhost:8000

The script should be runnable as:
```bash
python3 tests/integration_test.py
```

Return the complete Python script.
```

---

*End of SISPAA Intelligent Gemini Fix Prompts*  
*Total fixes: 9 prompts covering 7 critical issues + 6 redundancies from the project analysis*
