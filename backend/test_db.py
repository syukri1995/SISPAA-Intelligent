import asyncio
import os
import ssl
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

async def test_conn():
    print("Testing connection to:", settings.database_url)
    connect_args = {}
    if settings.database_url.startswith("mysql+aiomysql"):
        cert_path = Path(__file__).resolve().parents[2] / "isrgrootx1.pem"
        print("Cert path:", cert_path)
        if cert_path.exists():
            print("Cert found!")
            ssl_ctx = ssl.create_default_context(cafile=str(cert_path))
            connect_args["ssl"] = ssl_ctx
        else:
            print("CERT NOT FOUND!")

    engine = create_async_engine(settings.database_url, pool_pre_ping=True, connect_args=connect_args)
    try:
        async with engine.begin() as conn:
            print("Connected!")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test_conn())
