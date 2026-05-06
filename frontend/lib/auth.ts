export const AUTH_TOKEN_COOKIE = "sispaa_token";

export type UserRole = "admin" | "supervisor" | "worker" | "public";

export interface CurrentUser {
  user_id: string;
  role: UserRole;
  agency: string | null;
  token: string;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days = 1) {
  if (typeof document === "undefined") return;
  const maxAge = Math.floor(days * 24 * 60 * 60);
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || readCookie(AUTH_TOKEN_COOKIE);
}

/**
 * Get current user from localStorage/sessionStorage
 */
export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  const user_id = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");
  const agency = localStorage.getItem("agency");

  if (!token || !user_id || !role) return null;

  return {
    token,
    user_id,
    role: role as UserRole,
    agency: agency || null,
  };
}

/**
 * Check if user has a specific role
 */
export function hasRole(role: UserRole | UserRole[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  if (Array.isArray(role)) {
    return role.includes(user.role);
  }

  return user.role === role;
}

/**
 * Check if user has permission for a specific action
 */
export function hasPermission(permission: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  // Define role-permission mapping
  const permissions: Record<UserRole, string[]> = {
    admin: [
      "view_all_users",
      "manage_users",
      "view_all_work_orders",
      "view_agency_work_orders",
      "assign_work_orders",
      "view_own_work_orders",
      "complete_work_orders",
      "submit_complaint",
      "view_own_complaints",
      "view_system_logs",
      "view_analytics",
    ],
    supervisor: [
      "view_agency_work_orders",
      "assign_work_orders",
      "view_own_work_orders",
      "complete_work_orders",
      "submit_complaint",
      "view_own_complaints",
    ],
    worker: [
      "view_own_work_orders",
      "complete_work_orders",
      "submit_complaint",
      "view_own_complaints",
      "view_system_logs",
    ],
    public: [
      "submit_complaint",
      "view_own_complaints",
    ],
  };

  return permissions[user.role]?.includes(permission) || false;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getCurrentUser();
}

export function setAuthSession(session: {
  access_token: string;
  user_id?: string;
  role?: string;
  agency?: string | null;
}) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", session.access_token);
  if (session.user_id) localStorage.setItem("user_id", session.user_id);
  if (session.role) localStorage.setItem("role", session.role);
  if (typeof session.agency !== "undefined") localStorage.setItem("agency", session.agency || "");
  writeCookie(AUTH_TOKEN_COOKIE, session.access_token, 1);
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("role");
  localStorage.removeItem("agency");
  deleteCookie(AUTH_TOKEN_COOKIE);
}

export async function getErrorMessage(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (typeof data?.detail === "string") return data.detail;
      if (typeof data?.message === "string") return data.message;
      return JSON.stringify(data);
    }
    const text = await res.text();
    return text || `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

