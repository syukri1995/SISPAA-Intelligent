import pymysql
import os
from pathlib import Path

def test_conn():
    cert_path = str(Path(__file__).resolve().parents[1] / "isrgrootx1.pem")
    print("Testing pymysql connection...")
    try:
        conn = pymysql.connect(
            host="gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
            port=4000,
            user="44UF8XzxEeVxHXP.root",
            password="CfcmvoL5YBtmq5u4",
            database="sys",
            ssl={"ca": cert_path}
        )
        print("Connected successfully!")
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_conn()
