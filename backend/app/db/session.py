from __future__ import annotations

"""
Database session factory — Python 3.14 / Windows SSL workaround.

asyncmy and aiomysql both fail on Python 3.14 + Windows with [WinError 87]
during the SSL handshake because of a change in asyncio's transport layer.

The fix: use the *synchronous* PyMySQL driver but wrap every DB call in
asyncio.to_thread so FastAPI's async endpoints still work.  SQLAlchemy's
AsyncSession internally uses greenlets, so we can't use it with a sync
engine.  Instead we expose a thin async Session proxy that delegates to a
real sync sqlalchemy.orm.Session running in the thread pool.
"""

import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


# ---------------------------------------------------------------------------
# Build the sync (pymysql) engine
# ---------------------------------------------------------------------------

def _sync_db_url(url: str) -> str:
    url = url.replace("mysql+asyncmy://", "mysql+pymysql://", 1)
    url = url.replace("mysql+aiomysql://", "mysql+pymysql://", 1)
    return url


def _make_connect_args(url: str) -> dict:
    if not url.startswith("mysql+pymysql://"):
        return {}
    cert_path = Path(__file__).resolve().parents[3] / "isrgrootx1.pem"
    if cert_path.exists():
        return {"ssl": {"ca": str(cert_path)}}
    print("WARNING: isrgrootx1.pem not found – skipping CA verification")
    return {}


_sync_url = _sync_db_url(settings.database_url)
_connect_args = _make_connect_args(_sync_url)

_sync_engine = create_engine(
    _sync_url,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
    connect_args=_connect_args,
)

_SessionFactory = sessionmaker(bind=_sync_engine, expire_on_commit=False)


# ---------------------------------------------------------------------------
# Async session shim
# ---------------------------------------------------------------------------

class _AsyncSessionShim:
    """
    Wraps a sync SQLAlchemy Session and exposes an async interface so that
    the rest of the codebase (which uses AsyncSession) continues to work
    without modification.

    All DB calls are delegated to a thread via asyncio.to_thread.
    """

    def __init__(self, sync_session: Session) -> None:
        self._s = sync_session

    # -- query helpers used by routes --

    async def execute(self, *args, **kwargs):
        return await asyncio.to_thread(self._s.execute, *args, **kwargs)

    async def scalar(self, *args, **kwargs):
        return await asyncio.to_thread(self._s.scalar, *args, **kwargs)

    async def scalars(self, *args, **kwargs):
        return await asyncio.to_thread(self._s.scalars, *args, **kwargs)

    def add(self, instance):
        self._s.add(instance)

    async def flush(self, *args, **kwargs):
        await asyncio.to_thread(self._s.flush, *args, **kwargs)

    async def commit(self):
        await asyncio.to_thread(self._s.commit)

    async def rollback(self):
        await asyncio.to_thread(self._s.rollback)

    async def close(self):
        await asyncio.to_thread(self._s.close)

    async def refresh(self, instance):
        await asyncio.to_thread(self._s.refresh, instance)

    # Allow use as a context manager: async with session: ...
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self.rollback()
        else:
            await self.commit()
        await self.close()

    # Expose the underlying sync session for code that needs it
    @property
    def sync_session(self) -> Session:
        return self._s

    # SQLAlchemy identity_map compatibility
    @property
    def identity_map(self):
        return self._s.identity_map


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

@asynccontextmanager
async def _session_ctx() -> AsyncGenerator[_AsyncSessionShim, None]:
    sync_sess: Session = await asyncio.to_thread(_SessionFactory)
    shim = _AsyncSessionShim(sync_sess)
    try:
        yield shim
        await shim.commit()
    except Exception:
        await shim.rollback()
        raise
    finally:
        await shim.close()


async def get_session() -> AsyncGenerator[_AsyncSessionShim, None]:
    """FastAPI dependency that yields an async-compatible DB session."""
    async with _session_ctx() as session:
        yield session


# ---------------------------------------------------------------------------
# Compatibility shims for code that uses engine / SessionLocal directly
# ---------------------------------------------------------------------------

class _EngineShim:
    """Minimal shim that lets init_db.py call ``async with engine.begin()``."""

    def begin(self):
        return _ConnCtxManager()

    @property
    def dialect(self):
        return _sync_engine.dialect


class _ConnCtxManager:
    async def __aenter__(self):
        self._conn = await asyncio.to_thread(_sync_engine.connect)
        return _ConnShim(self._conn)

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await asyncio.to_thread(self._conn.rollback)
        else:
            await asyncio.to_thread(self._conn.commit)
        await asyncio.to_thread(self._conn.close)


class _ConnShim:
    def __init__(self, conn):
        self._c = conn

    async def execute(self, *args, **kwargs):
        return await asyncio.to_thread(self._c.execute, *args, **kwargs)

    async def run_sync(self, fn, *args, **kwargs):
        return await asyncio.to_thread(fn, self._c, *args, **kwargs)

    def scalar(self):
        pass  # not used in init_db


engine = _EngineShim()

# Keep SessionLocal available for any direct imports
SessionLocal = _SessionFactory
