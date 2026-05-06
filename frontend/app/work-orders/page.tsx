"use client";

import { useEffect, useState } from "react";
import { ComplaintTable, type RecentComplaintRow } from "@/components/ComplaintTable";
import { getRecentComplaints } from "@/lib/api";

export default function WorkOrdersPage() {
  const [rows, setRows] = useState<RecentComplaintRow[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await getRecentComplaints(50);
        setRows(r);
      } catch (error) {
        console.error("Failed to load work orders", error);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Work Orders</h1>
        <p className="text-gray-600">All recent work orders tracked by the system</p>
      </div>
      <ComplaintTable rows={rows} query={query} onQueryChange={setQuery} />
    </div>
  );
}

