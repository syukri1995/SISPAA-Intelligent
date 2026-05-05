import { ComplaintCreate, ComplaintStatus } from "@/types/complaint";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function postComplaint(payload: ComplaintCreate): Promise<ComplaintStatus> {
  const r = await fetch(`${baseUrl}/complaint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getStatus(id: string): Promise<ComplaintStatus> {
  const r = await fetch(`${baseUrl}/status/${id}`, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getLogs(limit = 200) {
  const r = await fetch(`${baseUrl}/logs?limit=${limit}`, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getMetrics() {
  const r = await fetch(`${baseUrl}/metrics`, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getRecentComplaints(limit = 25) {
  const r = await fetch(`${baseUrl}/complaints/recent?limit=${limit}`, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

