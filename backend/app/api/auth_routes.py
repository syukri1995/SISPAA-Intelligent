from __future__ import annotations

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.db.user_models import User
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserOut, UserUpdate
from app.services.auth import hash_password, verify_password, create_access_token, decode_access_token
from app.core.constants import VALID_ROLES, UserRole
from app.core.dependencies import get_current_user


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(payload: UserRegister, session: AsyncSession = Depends(get_session)):
    """Register a new public user. Role elevation (worker/supervisor/admin) is done by admins via PUT /auth/users/{id}."""
    # Check if username exists
    q = select(User).where(User.username == payload.username)
    existing = await session.execute(q)
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")

    # Check if email exists
    q = select(User).where(User.email == payload.email)
    existing = await session.execute(q)
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")

    # Role is always "public" on self-registration (enforced by UserRegister schema validator).
    # Use PUT /auth/users/{id} (admin only) to assign elevated roles.

    # Create new user
    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        agency=payload.agency,
        role=payload.role,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    token = create_access_token(str(user.id), user.role, user.agency)
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        role=user.role,
        agency=user.agency,
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, session: AsyncSession = Depends(get_session)):
    """Login user and return JWT token."""
    q = select(User).where(User.username == payload.username)
    user = (await session.execute(q)).scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")

    token = create_access_token(str(user.id), user.role, user.agency)
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        role=user.role,
        agency=user.agency,
    )


@router.get("/me", response_model=UserOut)
async def get_user_profile(
    user: Annotated[User, Depends(get_current_user)],
):
    """Get current authenticated user."""
    return UserOut(
        id=str(user.id),
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        agency=user.agency,
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


@router.get("/workers", response_model=list[UserOut])
async def list_workers(
    user: Annotated[User, Depends(get_current_user)],
    session: AsyncSession = Depends(get_session),
):
    """List all users (admin only)."""
    # Check if user is admin
    if user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")

    q = select(User).order_by(User.created_at.desc())
    result = await session.execute(q)
    users = list(result.scalars().all())

    return [
        UserOut(
            id=str(u.id),
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            agency=u.agency,
            is_active=u.is_active,
            created_at=u.created_at.isoformat() if u.created_at else None,
        )
        for u in users
    ]


@router.put("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    payload: UserUpdate,
    admin_user: Annotated[User, Depends(get_current_user)],
    session: AsyncSession = Depends(get_session),
):
    """Update user role and agency (admin only)."""
    # Check if user is admin
    if admin_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")

    # Get the user to update
    q = select(User).where(User.id == user_id)
    user = (await session.execute(q)).scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update role if provided
    if payload.role:
        if payload.role not in VALID_ROLES:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")
        user.role = payload.role

    # Update agency if provided
    if payload.agency is not None:
        user.agency = payload.agency

    await session.commit()
    await session.refresh(user)

    return UserOut(
        id=str(user.id),
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        agency=user.agency,
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )
