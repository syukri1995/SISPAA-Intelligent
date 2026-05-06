import asyncio
from pathlib import Path
import ssl
from sqlalchemy.ext.asyncio import create_async_engine

async def test_conn():
    url = "mysql+aiomysql://44UF8XzxEeVxHXP.root:CfcmvoL5YBtmq5u4@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?charset=utf8mb4"
    cert_path = Path(__file__).resolve().parents[1] / "isrgrootx1.pem"
    
    ssl_ctx = ssl.create_default_context(cafile=str(cert_path))
    connect_args = {"ssl": ssl_ctx}
    
    print("Testing aiomysql with patched start_tls...")
    engine = create_async_engine(url, pool_pre_ping=True, connect_args=connect_args)
    try:
        async with engine.begin() as conn:
            print("Connected successfully!")
    except Exception as e:
        print("Error:", repr(e))

if __name__ == "__main__":
    asyncio.run(test_conn())
