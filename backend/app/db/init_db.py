from __future__ import annotations

from sqlalchemy import text

from app.db.models import Base
from app.db.user_models import User  # Import to register model
from app.db.session import engine


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Only run these Postgres-specific migrations if using Postgres
        if engine.dialect.name == "postgresql":
            await conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS email VARCHAR(255)"))
            await conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS title VARCHAR(255)"))
            await conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS description TEXT"))
            await conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS category VARCHAR(64)"))
            await conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS priority VARCHAR(16)"))
            await conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS status VARCHAR(32)"))
            await conn.execute(text("ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(36)"))
            await conn.execute(text("ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(36)"))
            await conn.execute(text("ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE"))
            await conn.execute(text("ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE"))

