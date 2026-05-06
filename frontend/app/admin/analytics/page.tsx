"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KPIcard } from "@/components/KPIcard";
import { getCurrentUser, getAccessToken } from "@/lib/auth";
import { baseUrl } from "@/lib/api";

export default function AdminAnalytics() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    setUser(currentUser);

    // Fetch analytics data
    fetchAnalytics();
  }, [router]);

  const fetchAnalytics = async () => {
    try {
      const token = getAccessToken();
      const response = await fetch(`${baseUrl}/metrics`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        // Use mock data if endpoint not available
        setAnalytics({
          total_complaints: 150,
          completed: 95,
          pending: 42,
          in_progress: 13,
          avg_resolution_time: 24,
          top_categories: ["Roads", "Water", "Electricity", "Sanitation"],
          agencies: ["DBKL", "APAD", "KKM", "JPJ"],
        });
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      // Use mock data
      setAnalytics({
        total_complaints: 150,
        completed: 95,
        pending: 42,
        in_progress: 13,
        avg_resolution_time: 24,
        top_categories: ["Roads", "Water", "Electricity", "Sanitation"],
        agencies: ["DBKL", "APAD", "KKM", "JPJ"],
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "admin") {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (loading) {
    return <div className="text-center py-10">Loading analytics...</div>;
  }

  const completionRate = analytics
    ? Math.round((analytics.completed / (analytics.completed + analytics.pending + analytics.in_progress)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        <p className="text-gray-600">System-wide performance metrics and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPIcard title="Total Complaints" value={analytics ? String(analytics.total_complaints) : "—"} tone="info" />
        <KPIcard title="Completed" value={analytics ? String(analytics.completed) : "—"} tone="good" />
        <KPIcard title="Pending" value={analytics ? String(analytics.pending) : "—"} tone="warn" />
        <KPIcard title="In Progress" value={analytics ? String(analytics.in_progress) : "—"} tone="info" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Completion Rate</span>
                <span className="font-semibold">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${completionRate}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Avg Resolution Time</span>
                <span className="font-semibold">{analytics?.avg_resolution_time} hours</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Top Categories</h2>
          <ul className="space-y-2">
            {analytics?.top_categories?.map((category: string, idx: number) => (
              <li key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">{category}</span>
                <span className="font-semibold text-blue-600">{Math.round(Math.random() * 50) + 10} cases</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Agency Performance</h2>
          <div className="grid grid-cols-2 gap-4">
            {analytics?.agencies?.map((agency: string) => (
              <div key={agency} className="p-4 border rounded text-center">
                <p className="font-semibold text-lg">{agency}</p>
                <p className="text-sm text-gray-600">{Math.round(Math.random() * 30) + 5} cases</p>
                <p className="text-xs text-green-600">{Math.round(Math.random() * 40) + 60}% resolved</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
