"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { baseUrl } from "@/lib/api";

type Insights = {
  top_categories: { category: string; count: number }[];
  trend_series: { day: string; count: number }[];
  rising: { category: string; delta: number; direction: "up" | "down" }[];
  suggested_actions: { title: string; detail: string }[];
};

export function SmartInsightsPanel() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await fetch(`${baseUrl}/insights`, { cache: "no-store" });
        if (!r.ok) throw new Error("Failed");
        setData(await r.json());
      } catch {
        setError("Unable to load insights.");
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const topBar = useMemo(() => {
    if (!data) return [];
    return data.top_categories.map((x) => ({ name: x.category, value: x.count })).slice(0, 6);
  }, [data]);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Smart Insights</CardTitle>
          <Badge tone="info">AI-assisted</Badge>
        </CardHeader>
        <CardBody className="space-y-4">
          {error ? <Alert tone="danger" title="Insights unavailable">{error}</Alert> : null}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-semibold text-slate-900">Complaint trend (14 days)</div>
              <div className="mt-2 h-44">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.trend_series ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="insFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#64748B" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#64748B" allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#06B6D4" strokeWidth={2} fill="url(#insFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-semibold text-slate-900">Top categories</div>
              <div className="mt-2 h-44">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topBar} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} height={50} stroke="#64748B" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#64748B" allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0B1F3A" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Rising issues</div>
              <div className="mt-3 space-y-2">
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (data?.rising?.length ?? 0) === 0 ? (
                  <div className="text-sm text-slate-600">No rising issues detected.</div>
                ) : (
                  data!.rising.map((r) => (
                    <div key={r.category} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="text-sm text-slate-900">{r.category}</div>
                      <Badge tone="warn">+{r.delta}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Suggested government actions</div>
              <div className="mt-3 space-y-3">
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  (data?.suggested_actions ?? []).map((a, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-200 p-3">
                      <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                      <div className="mt-1 text-sm text-slate-700">{a.detail}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operational Notes</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 text-sm text-slate-700">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="font-semibold text-slate-900">What this panel does</div>
            <div className="mt-1">
              Highlights common categories, flags rising issues, and recommends actions for quicker coordination.
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="font-semibold text-slate-900">Next upgrade</div>
            <div className="mt-1">
              Add hotspot mapping (geo), agency-level bottleneck analysis, and LLM-generated weekly summary with citations.
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

