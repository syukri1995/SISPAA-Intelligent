from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(BACKEND_DIR / ".env"), extra="ignore")

    app_env: str = "local"
    app_name: str = "SISPAA Intelligent GovTech Router"
    public_base_url: str = "http://localhost:8000"

    # Local PostgreSQL default; override in backend/.env when needed.
    database_url: str = "postgresql+asyncpg://postgres:1234@localhost:5432/sispaa_router"

    redis_url: str = "redis://localhost:6379/0"
    enable_redis_queue: bool = False

    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    jwt_secret_key: str = "secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    groq_api_key: str | None = None
    groq_model: str = "llama-3.1-70b-versatile"

    # Complaint lifecycle / SLA
    sla_accept_within_hours: int = 4
    sla_auto_close_after_days: int = 7
    sla_deadline_hours_low: int = 72
    sla_deadline_hours_medium: int = 24
    sla_deadline_hours_high: int = 4
    lifecycle_job_interval_seconds: int = 60

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

