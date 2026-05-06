"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KPIcard } from "@/components/KPIcard";
import { getWorkerDashboard, getMyWorkOrders } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

interface WorkOrder {
  id: string;
  agency: string;
  priority: string;
  status: string;
  description: string;
  assigned_at: string | null;
  created_at: string | null;
}

interface Dashboard {
  assigned_to_me: number;
  pending_in_agency: number;
  completed_by_me: number;
}

export default function WorkerDashboard() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const fetchData = async () => {
      try {
        setDashboard(await getWorkerDashboard());
        setWorkOrders(await getMyWorkOrders());
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error loading dashboard";
        setError(message);
        // Token missing/invalid usually means the session is gone. Kick back to login.
        if (message.toLowerCase().includes("token") || message.includes("401")) {
          router.push("/auth/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Dashboard</h1>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <KPIcard title="Assigned to Me" value={dashboard.assigned_to_me} />
          <KPIcard title="Pending in Agency" value={dashboard.pending_in_agency} />
          <KPIcard title="Completed by Me" value={dashboard.completed_by_me} />
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">My Work Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Work Order ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Agency
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Assigned At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {workOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                    {wo.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{wo.agency}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        wo.priority === "HIGH"
                          ? "bg-red-100 text-red-800"
                          : wo.priority === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {wo.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        wo.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : wo.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {wo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {wo.assigned_at ? new Date(wo.assigned_at).toLocaleDateString() : "Not assigned"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
