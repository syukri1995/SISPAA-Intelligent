"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KPIcard } from "@/components/KPIcard";
import { getCurrentUser } from "@/lib/auth";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(getCurrentUser());
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    setUser(currentUser);

    // In a real app, fetch stats from backend
    setStats({
      total_users: 24,
      total_agencies: 5,
      active_complaints: 42,
      pending_work_orders: 18,
    });
  }, [router]);

  if (!user || user.role !== "admin") {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Control Panel</h1>
        <p className="text-gray-600">System administration and user management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPIcard title="Total Users" value={stats ? String(stats.total_users) : "—"} tone="info" />
        <KPIcard title="Agencies" value={stats ? String(stats.total_agencies) : "—"} tone="info" />
        <KPIcard title="Active Complaints" value={stats ? String(stats.active_complaints) : "—"} tone="warn" />
        <KPIcard title="Pending Work Orders" value={stats ? String(stats.pending_work_orders) : "—"} tone="warn" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">User Management</h2>
          <p className="text-gray-600 mb-4">Create, edit, and manage user accounts and roles</p>
          <button
            onClick={() => router.push("/admin/users")}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Manage Users
          </button>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Analytics & Reports</h2>
          <p className="text-gray-600 mb-4">View system metrics and performance analytics</p>
          <button
            onClick={() => router.push("/admin/analytics")}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            View Analytics
          </button>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">System Logs</h2>
          <p className="text-gray-600 mb-4">View audit trails and system logs</p>
          <button
            onClick={() => router.push("/logs")}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            View Logs
          </button>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">All Complaints</h2>
          <p className="text-gray-600 mb-4">View and manage all submitted complaints</p>
          <button
            onClick={() => router.push("/work-orders")}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            View Complaints
          </button>
        </div>
      </div>
    </div>
  );
}
