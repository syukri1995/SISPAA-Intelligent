import { ComplaintCreate, ComplaintStatus } from "@/types/complaint";
import { getAccessToken, getErrorMessage } from "@/lib/auth";

export const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function postComplaint(payload: ComplaintCreate): Promise<ComplaintStatus> {
  const r = await fetch(`${baseUrl}/complaint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}

export async function getStatus(id: string): Promise<ComplaintStatus> {
  const r = await fetch(`${baseUrl}/status/${id}`, { cache: "no-store" });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}

export async function getComplaintStatus(id: string): Promise<ComplaintStatus> {
  const r = await fetch(`${baseUrl}/complaint/${id}/status`, { cache: "no-store" });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}

export async function searchComplaintsByEmail(email: string): Promise<ComplaintStatus[]> {
  const r = await fetch(`${baseUrl}/complaint/search?email=${encodeURIComponent(email)}`, { cache: "no-store" });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}

export async function getLogs(limit = 200) {
  const r = await fetch(`${baseUrl}/logs?limit=${limit}`, { cache: "no-store" });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}

export async function getMetrics() {
  const r = await fetch(`${baseUrl}/metrics`, { cache: "no-store" });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}

export async function getRecentComplaints(limit = 25) {
  const r = await fetch(`${baseUrl}/complaints/recent?limit=${limit}`, { cache: "no-store" });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}

// Authentication endpoints
export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  agency?: string;
  role?: string;
}) {
  const r = await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    cache: "no-store"
  });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}

export async function loginUser(username: string, password: string) {
  const r = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    cache: "no-store"
  });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}

export async function getCurrentUser() {
  const r = await fetch(`${baseUrl}/auth/me`, {
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    cache: "no-store"
  });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}

// Worker dashboard endpoints
export async function getWorkerDashboard() {
  const r = await fetch(`${baseUrl}/worker/dashboard`, {
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    cache: "no-store"
  });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}

export async function getMyWorkOrders() {
  const r = await fetch(`${baseUrl}/worker/my-work-orders`, {
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    cache: "no-store"
  });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}

export async function getPendingWorkOrders() {
  const r = await fetch(`${baseUrl}/worker/pending-work-orders`, {
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    cache: "no-store"
  });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}

export async function assignWorkOrder(workOrderId: string, assignToUserId: string) {
  const r = await fetch(`${baseUrl}/worker/assign/${workOrderId}`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ assign_to_user_id: assignToUserId }),
    cache: "no-store"
  });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}

export async function completeWorkOrder(workOrderId: string) {
  const r = await fetch(`${baseUrl}/worker/complete/${workOrderId}`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    cache: "no-store"
  });
  if (!r.ok) throw new Error(await getErrorMessage(r));
  return r.json();
}

