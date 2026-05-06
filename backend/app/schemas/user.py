from __future__ import annotations

from pydantic import BaseModel, Field, EmailStr, field_validator


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(min_length=8, max_length=255)
    full_name: str | None = Field(default=None, max_length=255)
    agency: str | None = Field(default=None, max_length=64)
    role: str = Field(default="public")

    @field_validator("role", mode="before")
    @classmethod
    def validate_role(cls, v: str) -> str:
        """Allow public or worker (staff) roles on registration. 
        Admin/supervisor must be elevated later."""
        if v not in {"public", "worker"}:
            return "public"
        return v


class UserLogin(BaseModel):
    username: str
    password: str
    
class UserUpdate(BaseModel):
    role: str | None = Field(default=None, description="User role: admin, supervisor, worker, or public")
    agency: str | None = Field(default=None, max_length=64)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    agency: str | None = None


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    full_name: str | None
    role: str
    agency: str | None
    is_active: bool
    created_at: str
