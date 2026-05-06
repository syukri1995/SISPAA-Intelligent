"""Application constants and enumerations."""

from enum import Enum


class UserRole(str, Enum):
    """User role enumeration."""

    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    WORKER = "worker"
    PUBLIC = "public"

    def __str__(self) -> str:
        return self.value


class RolePermissions:
    """Role-based permissions mapping."""

    # Define what each role can access
    ADMIN_ROLES = {UserRole.ADMIN}
    SUPERVISOR_ROLES = {UserRole.SUPERVISOR, UserRole.ADMIN}
    WORKER_ROLES = {UserRole.WORKER, UserRole.SUPERVISOR, UserRole.ADMIN}
    PUBLIC_ROLES = {UserRole.PUBLIC, UserRole.WORKER, UserRole.SUPERVISOR, UserRole.ADMIN}

    # Endpoint access control
    PERMISSIONS = {
        "view_all_users": ADMIN_ROLES,
        "manage_users": ADMIN_ROLES,
        "view_all_work_orders": ADMIN_ROLES,
        "view_agency_work_orders": SUPERVISOR_ROLES,
        "assign_work_orders": SUPERVISOR_ROLES,
        "view_own_work_orders": WORKER_ROLES,
        "complete_work_orders": WORKER_ROLES,
        "submit_complaint": PUBLIC_ROLES,
        "view_own_complaints": PUBLIC_ROLES,
        "view_system_logs": {UserRole.ADMIN, UserRole.WORKER},
        "view_analytics": ADMIN_ROLES,
    }

    @classmethod
    def has_permission(cls, role: UserRole, permission: str) -> bool:
        """Check if a role has a specific permission."""
        allowed_roles = cls.PERMISSIONS.get(permission, set())
        return role in allowed_roles


# Default role for new users
DEFAULT_USER_ROLE = UserRole.PUBLIC

# Valid role values for validation
VALID_ROLES = {role.value for role in UserRole}
