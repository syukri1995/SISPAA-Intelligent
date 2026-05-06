from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.api.auth_routes import router as auth_router
from app.api.worker_routes import router as worker_router
from app.core.config import settings
from app.db.init_db import init_db


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


@app.on_event("startup")
async def _startup() -> None:
    await init_db()

