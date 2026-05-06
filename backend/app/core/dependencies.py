"""FastAPI dependency injections for authentication and authorization."""

from typing import Annotated
from functools import wraps

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.constants import UserRole, RolePermissions
from app.db.session import get_session
from app.db.user_models import User
from app.services.auth import decode_access_token
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


security = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)] = None,
) -> str:
    """Extract and validate JWT token, return user_id."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload.sub


async def get_current_user(
    user_id: Annotated[str, Depends(get_current_user_id)],
    session: AsyncSession = Depends(get_session),
) -> User:
    """Get current authenticated user from database."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


def require_role(*allowed_roles: UserRole | str):
    """
    Decorator to require specific roles for an endpoint.
    
    Usage:
        @router.get("/admin-only")
        @require_role(UserRole.ADMIN)
        async def admin_endpoint(user: User = Depends(get_current_user)):
            ...
    
    Or with multiple roles:
        @require_role(UserRole.ADMIN, UserRole.SUPERVISOR)
    """
    # Convert strings to UserRole enums
    roles = set()
    for role in allowed_roles:
        if isinstance(role, str):
            try:
                roles.add(UserRole(role))
            except ValueError:
                raise ValueError(f"Invalid role: {role}")
        else:
            roles.add(role)

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, user: User = None, **kwargs):
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                )

            try:
                user_role = UserRole(user.role)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invalid user role",
                )

            if user_role not in roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Required roles: {', '.join(r.value for r in roles)}",
                )

            return await func(*args, user=user, **kwargs)

        return wrapper

    return decorator


async def get_current_user_with_role(
    user: User = Depends(get_current_user),
    required_roles: set[UserRole] | None = None,
) -> User:
    """
    Get current user and optionally validate role.
    
    Usage in endpoint:
        async def endpoint(user: User = Depends(get_current_user_with_role)):
            ...
    """
    if required_roles:
        try:
            user_role = UserRole(user.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid user role",
            )

        if user_role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {', '.join(r.value for r in required_roles)}",
            )

    return user
