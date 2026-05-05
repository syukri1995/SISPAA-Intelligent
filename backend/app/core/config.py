from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "local"
    app_name: str = "SISPAA Intelligent GovTech Router"
    public_base_url: str = "http://localhost:8000"

    # TiDB is MySQL-compatible; use SQLAlchemy mysql+aiomysql DSN.
    database_url: str = "mysql+aiomysql://root:password@localhost:4000/sispaa_router?charset=utf8mb4"

    redis_url: str = "redis://localhost:6379/0"
    enable_redis_queue: bool = False

    cors_origins: str = "http://localhost:3000"

    groq_api_key: str | None = None
    groq_model: str = "llama-3.1-70b-versatile"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

