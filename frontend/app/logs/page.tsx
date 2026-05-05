"use client";

import { useEffect, useState } from "react";
import { getLogs } from "@/lib/api";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    getLogs(200).then(setLogs).catch(() => setLogs([]));
  }, []);

  return (
    <div className="card p-5">
      <div className="font-medium text-slate-900">Audit Logs</div>
      <div className="mt-4 space-y-3">
        {logs.map((l) => (
          <div key={l.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-slate-900">{l.event_type}</div>
              <div className="text-xs text-slate-600">{new Date(l.created_at).toLocaleString()}</div>
            </div>
            <div className="mt-1 text-sm text-slate-700">{l.message}</div>
            {l.complaint_id ? <div className="mt-1 text-xs font-mono text-slate-600">complaint_id={l.complaint_id}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

