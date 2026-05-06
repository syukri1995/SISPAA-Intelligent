"""
One-time migration: adds columns that exist in SQLAlchemy models
but are missing from the live TiDB schema.
Safe to re-run — skips columns that already exist.
"""
from __future__ import annotations
import asyncio, sys, os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.db.session import engine

MIGRATIONS = [
    # (table, column, definition)
    ("complaints",  "title",        "VARCHAR(255) NULL"),
    ("complaints",  "description",  "TEXT NULL"),
    ("complaints",  "email",        "VARCHAR(255) NULL"),
    ("complaints",  "category",     "VARCHAR(64)  NULL"),
    ("complaints",  "priority",     "VARCHAR(16)  NULL"),
    ("work_orders", "assigned_to",  "VARCHAR(36)  NULL"),
    ("work_orders", "assigned_by",  "VARCHAR(36)  NULL"),
    ("work_orders", "assigned_at",  "TIMESTAMP NULL"),
    ("work_orders", "completed_at", "TIMESTAMP NULL"),
]

async def run():
    async with engine.begin() as conn:
        for table, column, definition in MIGRATIONS:
            result = await conn.execute(
                text(
                    "SELECT COUNT(*) FROM information_schema.columns "
                    "WHERE table_schema = DATABASE() "
                    "AND table_name = :tbl AND column_name = :col"
                ),
                {"tbl": table, "col": column},
            )
            exists = result.scalar()
            if exists:
                print(f"  SKIP  {table}.{column} (already exists)")
            else:
                await conn.execute(text(f"ALTER TABLE `{table}` ADD COLUMN `{column}` {definition}"))
                print(f"  ADDED {table}.{column}")
    await engine.dispose()
    print("\nDone.")

if __name__ == "__main__":
    asyncio.run(run())
