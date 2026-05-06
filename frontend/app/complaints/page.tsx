"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getRecentComplaints } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/FormControls";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";

type ComplaintRow = {
  id: string;
  category?: string | null;
  agency?: string | null;
  status: string;
  timestamp?: string | null;
  confidence?: number | null;
};

function toneForStatus(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "COMPLETED" || s === "RESOLVED") return "good" as const;
  if (s === "IN_PROGRESS") return "info" as const;
  if (s === "PENDING" || s === "RECEIVED") return "warn" as const;
  return "neutral" as const;
}

export default function ComplaintListPage() {
  const [rows, setRows] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [agency, setAgency] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("ALL");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await getRecentComplaints(200);
        setRows(Array.isArray(r) ? r : []);
      } catch (e: any) {
        setError("Failed to load complaints. Please try again.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const agencies = useMemo(() => {
    const vals = new Set<string>();
    for (const r of rows) if (r.agency) vals.add(r.agency);
    return ["ALL", ...Array.from(vals).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const categories = useMemo(() => {
    const vals = new Set<string>();
    for (const r of rows) if (r.category) vals.add(r.category);
    return ["ALL", ...Array.from(vals).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "ALL" && (r.status || "").toUpperCase() !== status) return false;
      if (agency !== "ALL" && (r.agency || "") !== agency) return false;
      if (category !== "ALL" && (r.category || "") !== category) return false;
      if (!query) return true;
      const hay = `${r.id} ${r.category ?? ""} ${r.agency ?? ""} ${r.status ?? ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [rows, q, status, agency, category]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Complaint List"
        description="Browse and filter recent complaints captured by the AI router."
      />

      {error ? <Alert tone="danger" title="Unable to load">{error}</Alert> : null}

      <Card>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by ID, category, agency, status"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ALL">All</option>
                <option value="RECEIVED">Received</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="agency">Agency</Label>
              <Select id="agency" value={agency} onChange={(e) => setAgency(e.target.value)}>
                {agencies.map((a) => (
                  <option key={a} value={a}>
                    {a === "ALL" ? "All agencies" : a}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2" />
            <div className="md:col-span-2">
              <Label htmlFor="category">Category</Label>
              <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "ALL" ? "All categories" : c}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr className="border-b border-slate-200">
                <th scope="col" className="px-5 py-3 text-left font-semibold">
                  Complaint ID
                </th>
                <th scope="col" className="px-5 py-3 text-left font-semibold">
                  Category
                </th>
                <th scope="col" className="px-5 py-3 text-left font-semibold">
                  Agency
                </th>
                <th scope="col" className="px-5 py-3 text-left font-semibold">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 text-left font-semibold">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
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
                      <Skeleton className="h-4 w-32" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-600">
                    No complaints match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/complaints/${encodeURIComponent(r.id)}`}
                        className="font-mono text-xs text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-500"
                      >
                        {r.id}
                      </Link>
                      {typeof r.confidence === "number" ? (
                        <div className="mt-1 text-xs text-slate-500">Confidence: {r.confidence.toFixed(2)}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-slate-900">{r.category ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-900">{r.agency ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge tone={toneForStatus(r.status)}>{r.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {r.timestamp ? new Date(r.timestamp).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

