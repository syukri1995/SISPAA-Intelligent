from __future__ import annotations

from sqlalchemy import text

from app.db.models import Base
from app.db.user_models import User  # Import to register model
from app.db.session import engine


async def _add_column_if_missing(conn, table: str, column: str, definition: str) -> None:
    """MySQL/TiDB-compatible equivalent of ADD COLUMN IF NOT EXISTS."""
    result = await conn.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema = DATABASE() AND table_name = :tbl AND column_name = :col"
        ),
        {"tbl": table, "col": column},
    )
    exists = result.scalar()
    if not exists:
        await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        if engine.dialect.name == "postgresql":
            # Postgres supports ADD COLUMN IF NOT EXISTS natively
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

        elif engine.dialect.name == "mysql":
            # TiDB/MySQL: check information_schema before altering
            await _add_column_if_missing(conn, "complaints", "title", "VARCHAR(255) NULL")
            await _add_column_if_missing(conn, "complaints", "description", "TEXT NULL")
            await _add_column_if_missing(conn, "complaints", "email", "VARCHAR(255) NULL")
            await _add_column_if_missing(conn, "complaints", "category", "VARCHAR(64) NULL")
            await _add_column_if_missing(conn, "complaints", "priority", "VARCHAR(16) NULL")
            await _add_column_if_missing(conn, "work_orders", "assigned_to", "VARCHAR(36) NULL")
            await _add_column_if_missing(conn, "work_orders", "assigned_by", "VARCHAR(36) NULL")
            await _add_column_if_missing(conn, "work_orders", "assigned_at", "TIMESTAMP NULL")
            await _add_column_if_missing(conn, "work_orders", "completed_at", "TIMESTAMP NULL")
            # Ensure assignments and action_logs tables exist (created by create_all above)


