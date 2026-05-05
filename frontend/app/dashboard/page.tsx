"use client";

import { useEffect, useMemo, useState } from "react";
import { KPIcard } from "@/components/KPIcard";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { ComplaintTable, type RecentComplaintRow } from "@/components/ComplaintTable";
import { getMetrics, getRecentComplaints } from "@/lib/api";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [rows, setRows] = useState<RecentComplaintRow[]>([]);
  const [query, setQuery] = useState("");

  const active = useMemo(() => {
    const latest = rows[0];
    if (!latest) return "Complaint";
    if (latest.status === "COMPLETED") return "Completed";
    return "Reason";
  }, [rows]);

  const confidence = rows[0]?.confidence ?? null;

  useEffect(() => {
    (async () => {
      const [m, r] = await Promise.all([getMetrics(), getRecentComplaints(25)]);
      setMetrics(m);
      setRows(r);
    })().catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPIcard title="Total Complaints Today" value={metrics ? String(metrics.total_complaints_today) : "—"} tone="info" />
        <KPIcard
          title="Auto-Resolved %"
          value={metrics ? `${metrics.auto_resolved_pct}%` : "—"}
          tone={(metrics?.auto_resolved_pct ?? 0) > 70 ? "good" : "warn"}
        />
        <KPIcard title="Pending Cases" value={metrics ? String(metrics.pending_cases) : "—"} tone="warn" />
        <KPIcard title="Avg Response Time" value={metrics?.avg_response_time_minutes ? `${metrics.avg_response_time_minutes}m` : "—"} />
      </div>

      <WorkflowStepper active={active} confidence={confidence} />

      <ComplaintTable rows={rows} query={query} onQueryChange={setQuery} />
    </div>
  );
}

