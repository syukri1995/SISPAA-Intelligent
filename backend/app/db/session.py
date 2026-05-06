from __future__ import annotations

import os
import ssl
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

connect_args = {}
if settings.database_url.startswith("mysql+aiomysql"):
    cert_path = settings.model_config.get("env_file", "")
    # Actually, let's use the known project structure. BACKEND_DIR is imported in config but we don't import it here.
    # Let's import Path from pathlib.
    from pathlib import Path
    cert_path = Path(__file__).resolve().parents[3] / "isrgrootx1.pem"
    if cert_path.exists():
        ssl_ctx = ssl.create_default_context(cafile=str(cert_path))
        connect_args["ssl"] = ssl_ctx
    else:
        print("WARNING: isrgrootx1.pem not found at", cert_path)

engine: AsyncEngine = create_async_engine(settings.database_url, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session

