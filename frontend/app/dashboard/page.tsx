"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KPIcard } from "@/components/KPIcard";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { ComplaintTable, type RecentComplaintRow } from "@/components/ComplaintTable";
import { getMetrics, getRecentComplaints } from "@/lib/api";
import { getCurrentUser, hasRole } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [rows, setRows] = useState<RecentComplaintRow[]>([]);
  const [query, setQuery] = useState("");
  const [user, setUser] = useState(getCurrentUser());

  const active = useMemo(() => {
    const latest = rows[0];
    if (!latest) return "Complaint";
    if (latest.status === "COMPLETED") return "Completed";
    return "Reason";
  }, [rows]);

  const confidence = rows[0]?.confidence ?? null;

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
        const [m, r] = await Promise.all([getMetrics(), getRecentComplaints(25)]);
        setMetrics(m);
        setRows(r);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
    })();
  }, [router]);

  if (!user) {
    return <div className="text-center py-10">Loading...</div>;
  }

  // Admin Dashboard
  if (user.role === "admin") {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPIcard title="Total Complaints" value={metrics ? String(metrics.total_complaints_today) : "—"} tone="info" />
          <KPIcard title="Pending Cases" value={metrics ? String(metrics.pending_cases) : "—"} tone="warn" />
          <KPIcard title="In Progress" value={metrics ? String(metrics.in_progress_cases ?? 0) : "—"} tone="info" />
          <KPIcard title="Completed" value={metrics ? String(metrics.completed_cases ?? 0) : "—"} tone="good" />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Quick Actions</h2>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/admin/users")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Manage Users
            </button>
            <button
              onClick={() => router.push("/admin/analytics")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Analytics
            </button>
          </div>
        </div>

        <ComplaintTable rows={rows} query={query} onQueryChange={setQuery} />
      </div>
    );
  }

  // Worker Dashboard
  if (user.role === "worker") {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Worker Dashboard</h1>
          <p className="text-gray-600">Your assigned work orders and tasks</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPIcard title="Assigned to Me" value={metrics ? String(metrics.assigned_to_me) : "—"} tone="info" />
          <KPIcard title="Pending in Agency" value={metrics ? String(metrics.pending_in_agency) : "—"} tone="warn" />
          <KPIcard title="Completed by Me" value={metrics ? String(metrics.completed_by_me) : "—"} tone="good" />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Quick Links</h2>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/work-orders")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Work Orders
            </button>
            <button
              onClick={() => router.push("/submit")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Submit Complaint
            </button>
          </div>
        </div>

        <ComplaintTable rows={rows} query={query} onQueryChange={setQuery} />
      </div>
    );
  }

  // Supervisor Dashboard
  if (user.role === "supervisor") {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
          <p className="text-gray-600">Manage work orders and team performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPIcard title="Pending" value={metrics ? String(metrics.pending_cases) : "—"} tone="warn" />
          <KPIcard title="In Progress" value={metrics ? String(metrics.in_progress_cases ?? 0) : "—"} tone="info" />
          <KPIcard title="Completed" value={metrics ? String(metrics.completed_cases ?? 0) : "—"} tone="good" />
          <KPIcard title="Response Time" value={metrics?.avg_response_time_minutes ? `${metrics.avg_response_time_minutes}m` : "—"} />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Management Tools</h2>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/work-orders")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Assign Work Orders
            </button>
            <button
              onClick={() => router.push("/logs")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Logs
            </button>
          </div>
        </div>

        <ComplaintTable rows={rows} query={query} onQueryChange={setQuery} />
      </div>
    );
  }

  // Public Dashboard
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Public Dashboard</h1>
        <p className="text-gray-600">Submit a complaint or check the status of an existing one</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-900 mb-4">Submit a Complaint</h2>
          <p className="text-gray-600 mb-4">Report an issue to the appropriate government agency</p>
          <button
            onClick={() => router.push("/submit")}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            New Complaint
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Track Status</h2>
          <p className="text-gray-600 mb-4">Check the status of your complaint</p>
          <button
            onClick={() => router.push("/status")}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Track Complaint
          </button>
        </div>
      </div>

      <ComplaintTable rows={rows} query={query} onQueryChange={setQuery} />
    </div>
  );
}

