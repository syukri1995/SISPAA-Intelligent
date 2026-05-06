"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ResponsiveContainer, Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { getMetrics, getRecentComplaints, getWorkerDashboard } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle, CardKPI } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SmartInsightsPanel } from "@/components/SmartInsightsPanel";

export default function DashboardPage() {
  const router = useRouter();
  // Start as null so SSR and first client render are identical (avoids hydration mismatch).
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [worker, setWorker] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);

  const active = useMemo(() => {
    const latest = recent[0];
    if (!latest) return { label: "No activity", tone: "neutral" as const };
    if ((latest.status || "").toUpperCase() === "COMPLETED") return { label: "Completed", tone: "good" as const };
    if ((latest.status || "").toUpperCase() === "IN_PROGRESS") return { label: "In progress", tone: "info" as const };
    return { label: "Received", tone: "warn" as const };
  }, [recent]);

  useEffect(() => {
    // Check authentication
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/auth/login");
      return;
    }
    setUser(currentUser);

    // Load data based on role
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [m, r] = await Promise.all([getMetrics(), getRecentComplaints(25)]);
        setMetrics(m);
        setRecent(Array.isArray(r) ? r : []);
        if (currentUser.role === "worker" || currentUser.role === "supervisor" || currentUser.role === "admin") {
          try {
            const wd = await getWorkerDashboard();
            setWorker(wd);
          } catch {
            setWorker(null);
          }
        }
      } catch (error) {
        setError("Failed to load dashboard data. Please refresh and try again.");
      }
      finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const chartData = useMemo(() => {
    // Simple trend proxy using recent timestamps (keeps UI responsive and local)
    // Replace with a real aggregated endpoint later.
    const buckets = new Map<string, number>();
    for (const r of recent) {
      const d = r.timestamp ? new Date(r.timestamp) : null;
      if (!d || Number.isNaN(d.getTime())) continue;
      const key = d.toLocaleDateString("en-MY", { month: "short", day: "2-digit" });
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets.entries())
      .map(([date, count]) => ({ date, count }))
      .slice(-14);
  }, [recent]);

  // Suppress rendering until the client has read auth state from localStorage.
  // This ensures SSR output == first client render, preventing hydration errors.
  if (!user) {
    return <div className="text-center py-10 text-sm text-slate-600">Loading…</div>;
  }

  const kpi = {
    today: metrics?.total_complaints_today ?? null,
    pending: metrics?.pending_cases ?? null,
    autoResolved: metrics?.auto_resolved_pct ?? null
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description={
          user.role === "public"
            ? "Submit a complaint or track an existing case."
            : "Operational overview for complaint routing and handling."
        }
        actions={
          user.role === "public" ? (
            <>
              <Button onClick={() => router.push("/submit")}>Submit Complaint</Button>
              <Button variant="outline" onClick={() => router.push("/status")}>
                Track Status
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => router.push("/complaints")}>
                Complaint List
              </Button>
              <Button onClick={() => router.push("/work-orders")}>Work Orders</Button>
            </>
          )
        }
      />

      {error ? <Alert tone="danger" title="Unable to load">{error}</Alert> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <CardKPI
          label="Complaints (Today)"
          value={loading ? <Skeleton className="h-7 w-20" /> : kpi.today ?? "—"}
          hint="All submissions received today"
        />
        <CardKPI
          label="Pending Cases"
          value={loading ? <Skeleton className="h-7 w-20" /> : kpi.pending ?? "—"}
          hint="Not yet completed"
        />
        <CardKPI
          label="Auto-Resolved %"
          value={loading ? <Skeleton className="h-7 w-24" /> : kpi.autoResolved != null ? `${kpi.autoResolved}%` : "—"}
          hint="Prototype metric"
        />
      </div>

      {(user.role === "worker" || user.role === "supervisor" || user.role === "admin") ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <CardKPI
            label="Assigned to me"
            value={loading ? <Skeleton className="h-7 w-16" /> : worker?.assigned_to_me ?? "—"}
          />
          <CardKPI
            label="Pending in agency"
            value={loading ? <Skeleton className="h-7 w-16" /> : worker?.pending_in_agency ?? "—"}
          />
          <CardKPI
            label="Completed by me"
            value={loading ? <Skeleton className="h-7 w-16" /> : worker?.completed_by_me ?? "—"}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Complaint Trend (Recent)</CardTitle>
              <div className="mt-1 text-sm text-slate-600">Quick view based on recent activity.</div>
            </div>
            <Badge tone={active.tone}>{active.label}</Badge>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : chartData.length === 0 ? (
              <div className="text-sm text-slate-600">No recent activity yet.</div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="govFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748B" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#64748B" allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#06B6D4" fill="url(#govFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            <Button className="w-full" onClick={() => router.push("/submit")}>
              Submit Complaint
            </Button>
            <Button className="w-full" variant="outline" onClick={() => router.push("/complaints")}>
              View Complaint List
            </Button>
            <Button className="w-full" variant="outline" onClick={() => router.push("/logs")}>
              View Audit Logs
            </Button>
            {user.role === "admin" ? (
              <>
                <Button className="w-full" variant="secondary" onClick={() => router.push("/admin/users")}>
                  User Management
                </Button>
                <Button className="w-full" variant="secondary" onClick={() => router.push("/admin/settings")}>
                  Admin Settings
                </Button>
              </>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recent Complaints</CardTitle>
          <Link className="text-sm text-cyan-800 underline underline-offset-4" href="/complaints">
            View all
          </Link>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr className="border-b border-slate-200">
                <th className="px-5 py-3 text-left font-semibold">Complaint ID</th>
                <th className="px-5 py-3 text-left font-semibold">Category</th>
                <th className="px-5 py-3 text-left font-semibold">Agency</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                <th className="px-5 py-3 text-left font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-5 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-5 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-5 py-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-5 py-3">
                      <Skeleton className="h-4 w-28" />
                    </td>
                  </tr>
                ))
              ) : recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-600">
                    No complaints yet.
                  </td>
                </tr>
              ) : (
                recent.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/complaints/${encodeURIComponent(r.id)}`}
                        className="font-mono text-xs text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-500"
                      >
                        {r.id}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{r.category ?? "—"}</td>
                    <td className="px-5 py-3">{r.agency ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge tone={(r.status || "").toUpperCase() === "COMPLETED" ? "good" : "neutral"}>{r.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{r.timestamp ? new Date(r.timestamp).toLocaleString() : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <SmartInsightsPanel />
    </div>
  );
}

