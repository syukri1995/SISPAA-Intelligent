import asyncio
from pathlib import Path
import ssl

async def test():
    host = "gateway01.ap-southeast-1.prod.aws.tidbcloud.com"
    port = 4000
    
    cert_path = Path(__file__).resolve().parents[1] / "isrgrootx1.pem"
    ssl_ctx = ssl.create_default_context(cafile=str(cert_path))
    
    print("Testing asyncio.open_connection...")
    try:
        reader, writer = await asyncio.open_connection(host, port, ssl=ssl_ctx)
        print("Connected!")
        writer.close()
        await writer.wait_closed()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test())
