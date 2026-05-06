from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.api.auth_routes import router as auth_router
from app.api.worker_routes import router as worker_router
from app.api.lifecycle_routes import router as lifecycle_router
from app.api.insights_routes import router as insights_router
from app.core.config import settings
from app.db.init_db import init_db
from app.workers.lifecycle_jobs import start_lifecycle_jobs
from app.core.rate_limit import SimpleRateLimiter


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(auth_router)
app.include_router(worker_router)
app.include_router(lifecycle_router)
app.include_router(insights_router)

# Basic spam protection for complaint submission endpoints
_limiter = SimpleRateLimiter(max_requests=30, window_seconds=60)  # 30 req/min per IP


@app.middleware("http")
async def _rate_limit(request: Request, call_next):
    path = request.url.path or ""
    if request.method == "POST" and path in ("/complaint", "/complaints"):
        ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else "unknown")
        key = f"{ip}:{path}"
        if not _limiter.allow(key):
            return JSONResponse({"detail": "Too many requests. Please slow down."}, status_code=429)
    return await call_next(request)


def _cors_headers(request: Request) -> dict:
    """Build CORS headers for error responses so the browser sees the real status."""
    origin = request.headers.get("origin", "")
    allowed = settings.cors_origins_list
    if origin in allowed or "*" in allowed:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Re-attach CORS headers on HTTP error responses (401, 403, etc.)."""
    headers = {**_cors_headers(request), **(exc.headers or {})}
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers,
    )


@app.on_event("startup")
async def _startup() -> None:
    await init_db()
    start_lifecycle_jobs()
