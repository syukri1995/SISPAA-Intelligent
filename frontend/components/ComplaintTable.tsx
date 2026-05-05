import { cn } from "@/lib/cn";

export type RecentComplaintRow = {
  id: string;
  category?: string | null;
  agency?: string | null;
  status: string;
  timestamp?: string | null;
  confidence?: number | null;
};

export function ComplaintTable(props: { rows: RecentComplaintRow[]; query: string; onQueryChange: (v: string) => void }) {
  const rows = props.rows.filter((r) => (r.id + (r.category ?? "") + (r.agency ?? "")).toLowerCase().includes(props.query));

  return (
    <div className="card">
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="font-medium text-slate-900">Recent Complaints</div>
        <input
          value={props.query}
          onChange={(e) => props.onQueryChange(e.target.value.toLowerCase())}
          placeholder="Search by id/category/agency"
          className={cn("w-72 max-w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-300")}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left font-medium px-4 py-2">ID</th>
              <th className="text-left font-medium px-4 py-2">Category</th>
              <th className="text-left font-medium px-4 py-2">Agency</th>
              <th className="text-left font-medium px-4 py-2">Status</th>
              <th className="text-left font-medium px-4 py-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-mono text-xs text-slate-700">{r.id.slice(0, 8)}…</td>
                <td className="px-4 py-2">{r.category ?? "—"}</td>
                <td className="px-4 py-2">{r.agency ?? "—"}</td>
                <td className="px-4 py-2">{r.status}</td>
                <td className="px-4 py-2 text-slate-600">{r.timestamp ? new Date(r.timestamp).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

