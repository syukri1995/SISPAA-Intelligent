"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { assignWorkOrder, completeWorkOrder, getMyWorkOrders, getPendingWorkOrders } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label } from "@/components/ui/FormControls";
import { Skeleton } from "@/components/ui/Skeleton";

export default function WorkOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [tab, setTab] = useState<"my" | "pending">("my");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [my, setMy] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);

  const [assigning, setAssigning] = useState<Record<string, boolean>>({});
  const [completing, setCompleting] = useState<Record<string, boolean>>({});
  const [assignTo, setAssignTo] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const current = getCurrentUser();
        if (!current) {
          router.push("/auth/login");
          return;
        }
        setUser(current);

        // Default tab based on role
        if (current.role === "supervisor" || current.role === "admin") setTab("pending");
        else setTab("my");

        const [mine, pend] = await Promise.all([
          (async () => {
            try {
              return await getMyWorkOrders();
            } catch {
              return [];
            }
          })(),
          (async () => {
            try {
              return await getPendingWorkOrders();
            } catch {
              return [];
            }
          })()
        ]);

        setMy(Array.isArray(mine) ? mine : []);
        setPending(Array.isArray(pend) ? pend : []);
      } catch (error) {
        setError("Failed to load work orders. Please try again.");
      }
      finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const canSeePending = user?.role === "supervisor" || user?.role === "admin";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Work Orders"
        description="Manage assignments and completion of routed complaints."
        actions={
          <>
            {canSeePending ? (
              <Button variant={tab === "pending" ? "primary" : "outline"} onClick={() => setTab("pending")}>
                Pending queue
              </Button>
            ) : null}
            <Button variant={tab === "my" ? "primary" : "outline"} onClick={() => setTab("my")}>
              My work orders
            </Button>
          </>
        }
      />

      {error ? <Alert tone="danger" title="Unable to load">{error}</Alert> : null}

      {tab === "pending" && !canSeePending ? (
        <Alert tone="warn" title="Access restricted">Supervisors and admins can access the pending queue.</Alert>
      ) : null}

      {tab === "pending" && canSeePending ? (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Pending Work Orders</CardTitle>
            <div className="text-sm text-slate-600">Assign to a staff member to start processing.</div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3 text-left font-semibold">Work order</th>
                  <th className="px-5 py-3 text-left font-semibold">Agency</th>
                  <th className="px-5 py-3 text-left font-semibold">Priority</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Assign to (user id)</th>
                  <th className="px-5 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-5 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-5 py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-5 py-3"><Skeleton className="h-9 w-52" /></td>
                      <td className="px-5 py-3"><Skeleton className="h-9 w-24" /></td>
                    </tr>
                  ))
                ) : pending.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-600">
                      No pending work orders right now.
                    </td>
                  </tr>
                ) : (
                  pending.map((wo) => (
                    <tr key={wo.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="font-mono text-xs text-slate-900 break-all">{wo.id}</div>
                        {wo.complaint_id ? (
                          <Button
                            variant="ghost"
                            className="mt-1 h-7 px-2 text-xs"
                            onClick={() => router.push(`/complaints/${encodeURIComponent(wo.complaint_id)}`)}
                          >
                            View complaint
                          </Button>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-slate-900">{wo.agency ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-900">{wo.priority ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge tone="warn">{wo.status ?? "PENDING"}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="space-y-1">
                          <Label className="sr-only" htmlFor={`assign-${wo.id}`}>
                            Assign to user id
                          </Label>
                          <Input
                            id={`assign-${wo.id}`}
                            value={assignTo[wo.id] ?? ""}
                            onChange={(e) => setAssignTo((m) => ({ ...m, [wo.id]: e.target.value }))}
                            placeholder="Paste worker user id (UUID)"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Button
                          size="sm"
                          disabled={!!assigning[wo.id] || !(assignTo[wo.id] ?? "").trim()}
                          onClick={async () => {
                            const userId = (assignTo[wo.id] ?? "").trim();
                            if (!userId) return;
                            setAssigning((m) => ({ ...m, [wo.id]: true }));
                            setError(null);
                            try {
                              await assignWorkOrder(String(wo.id), userId);
                              // Refresh pending list
                              const pend = await getPendingWorkOrders();
                              setPending(Array.isArray(pend) ? pend : []);
                            } catch {
                              setError("Failed to assign the work order. Ensure the user id is valid and try again.");
                            } finally {
                              setAssigning((m) => ({ ...m, [wo.id]: false }));
                            }
                          }}
                        >
                          {assigning[wo.id] ? "Assigning…" : "Assign"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {tab === "my" ? (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>My Work Orders</CardTitle>
            <div className="text-sm text-slate-600">Complete a work order when resolved.</div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-3 text-left font-semibold">Work order</th>
                    <th className="px-5 py-3 text-left font-semibold">Agency</th>
                    <th className="px-5 py-3 text-left font-semibold">Priority</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-left font-semibold">Assigned at</th>
                    <th className="px-5 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-5 py-3"><Skeleton className="h-4 w-40" /></td>
                        <td className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-5 py-3"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-5 py-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-5 py-3"><Skeleton className="h-9 w-28" /></td>
                      </tr>
                    ))
                  ) : my.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-600">
                        No work orders assigned to you yet.
                      </td>
                    </tr>
                  ) : (
                    my.map((wo) => {
                      const status = (wo.status || "").toUpperCase();
                      const badgeTone = status === "COMPLETED" ? "good" : status === "IN_PROGRESS" ? "info" : "neutral";
                      const canComplete = status !== "COMPLETED";
                      return (
                        <tr key={wo.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3">
                            <div className="font-mono text-xs text-slate-900 break-all">{wo.id}</div>
                            {wo.complaint_id ? (
                              <Button
                                variant="ghost"
                                className="mt-1 h-7 px-2 text-xs"
                                onClick={() => router.push(`/complaints/${encodeURIComponent(wo.complaint_id)}`)}
                              >
                                View complaint
                              </Button>
                            ) : null}
                          </td>
                          <td className="px-5 py-3 text-slate-900">{wo.agency ?? "—"}</td>
                          <td className="px-5 py-3 text-slate-900">{wo.priority ?? "—"}</td>
                          <td className="px-5 py-3">
                            <Badge tone={badgeTone as any}>{wo.status ?? "—"}</Badge>
                          </td>
                          <td className="px-5 py-3 text-slate-700">{wo.assigned_at ? new Date(wo.assigned_at).toLocaleString() : "—"}</td>
                          <td className="px-5 py-3">
                            <Button
                              size="sm"
                              variant={canComplete ? "primary" : "outline"}
                              disabled={!canComplete || !!completing[wo.id]}
                              onClick={async () => {
                                setCompleting((m) => ({ ...m, [wo.id]: true }));
                                setError(null);
                                try {
                                  await completeWorkOrder(String(wo.id));
                                  const mine = await getMyWorkOrders();
                                  setMy(Array.isArray(mine) ? mine : []);
                                } catch {
                                  setError("Failed to complete the work order. Please try again.");
                                } finally {
                                  setCompleting((m) => ({ ...m, [wo.id]: false }));
                                }
                              }}
                            >
                              {status === "COMPLETED" ? "Completed" : completing[wo.id] ? "Completing…" : "Mark completed"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

