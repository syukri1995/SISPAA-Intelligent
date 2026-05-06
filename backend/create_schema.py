import os
from pathlib import Path
from sqlalchemy import create_engine
from app.db.models import Base
from app.db.user_models import User
from app.core.config import settings

def create_schema():
    print("Creating DB schema in 'test' database using sync PyMySQL...")
    cert_path = Path(__file__).resolve().parents[1] / "isrgrootx1.pem"
    
    url = f"mysql+pymysql://44UF8XzxEeVxHXP.root:CfcmvoL5YBtmq5u4@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?charset=utf8mb4"
    
    connect_args = {"ssl": {"ca": str(cert_path)}}
    
    engine = create_engine(url, connect_args=connect_args, echo=True)
    
    try:
        Base.metadata.create_all(engine)
        print("Schema creation successful!")
    except Exception as e:
        print("Error during schema creation:", e)

if __name__ == "__main__":
    create_schema()
