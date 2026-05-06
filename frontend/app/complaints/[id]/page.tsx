"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  acceptComplaint,
  confirmComplaint,
  getComplaintActions,
  getComplaintV2,
  rejectComplaint,
  resolveComplaint,
  startComplaint,
  type ActionLogV2,
  type ComplaintV2
} from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input, Label, Textarea } from "@/components/ui/FormControls";
import { getCurrentUser } from "@/lib/auth";

function toneForStatus(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "CLOSED") return "good" as const;
  if (s === "RESOLVED") return "warn" as const;
  if (s === "IN_PROGRESS") return "info" as const;
  if (s === "ACCEPTED" || s === "ASSIGNED") return "warn" as const;
  if (s === "SUBMITTED") return "neutral" as const;
  return "neutral" as const;
}

function formatCountdown(targetIso: string | null | undefined) {
  if (!targetIso) return null;
  const t = new Date(targetIso).getTime();
  if (Number.isNaN(t)) return null;
  const diffMs = t - Date.now();
  const sign = diffMs < 0 ? "-" : "";
  const abs = Math.abs(diffMs);
  const minutes = Math.floor(abs / (60 * 1000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  const remMin = minutes % 60;
  if (days > 0) return `${sign}${days}d ${remHours}h`;
  if (hours > 0) return `${sign}${hours}h ${remMin}m`;
  return `${sign}${remMin}m`;
}

export default function ComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ? decodeURIComponent(params.id) : "";

  const [data, setData] = useState<ComplaintV2 | null>(null);
  const [actions, setActions] = useState<ActionLogV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // citizen inputs (when RESOLVED)
  const [citizenEmail, setCitizenEmail] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // officer resolve proof
  const [proofUrl, setProofUrl] = useState("");
  const user = getCurrentUser();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [c, a] = await Promise.all([getComplaintV2(id), getComplaintActions(id)]);
        setData(c);
        setActions(Array.isArray(a) ? a : []);
      } catch (e: any) {
        setError("Unable to load complaint details.");
        setData(null);
        setActions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const meta = useMemo(() => {
    const created = data?.created_at ? new Date(data.created_at).toLocaleString() : "—";
    const updated = data?.updated_at ? new Date(data.updated_at).toLocaleString() : "—";
    return { created, updated };
  }, [data?.created_at, data?.updated_at]);

  const status = (data?.status || "").toUpperCase();
  const deadlineCountdown = formatCountdown(data?.deadline_at);
  const isLate = !!deadlineCountdown && deadlineCountdown.startsWith("-");
  const escalated = !!data?.escalated_at;

  const canOfficerAct = user?.role === "worker" || user?.role === "supervisor" || user?.role === "admin";
  const canAccept = canOfficerAct && status === "ASSIGNED";
  const canStart = canOfficerAct && status === "ACCEPTED";
  const canResolve = canOfficerAct && status === "IN_PROGRESS";
  const canCitizenConfirm = status === "RESOLVED";
  const canCitizenReject = status === "RESOLVED";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Complaint Detail"
        description="View status, SLA timeline, and actions for a single complaint."
        actions={
          <>
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button variant="secondary" onClick={() => router.push("/complaints")}>
              Complaint List
            </Button>
          </>
        }
      />

      {error ? <Alert tone="danger" title="Unable to load">{error}</Alert> : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle>Summary</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {loading ? <Skeleton className="h-6 w-28" /> : <Badge tone={toneForStatus(data?.status ?? "")}>{data?.status ?? "—"}</Badge>}
              {escalated ? <Badge tone="danger">Escalated</Badge> : null}
              {isLate ? <Badge tone="danger">Late</Badge> : null}
            </div>
          </div>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Complaint ID</div>
            {loading ? <Skeleton className="mt-2 h-4 w-80" /> : <div className="mt-2 font-mono text-xs">{data?.id ?? id}</div>}
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Agency</div>
            {loading ? <Skeleton className="mt-2 h-4 w-40" /> : <div className="mt-2 text-sm text-slate-900">{data?.category ? "Routed by category" : "—"}</div>}
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Category</div>
            {loading ? <Skeleton className="mt-2 h-4 w-40" /> : <div className="mt-2 text-sm text-slate-900">{data?.category ?? "—"}</div>}
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Priority</div>
            {loading ? <Skeleton className="mt-2 h-4 w-24" /> : <div className="mt-2 text-sm text-slate-900">{data?.priority ?? "—"}</div>}
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">SLA Deadline</div>
            {loading ? (
              <Skeleton className="mt-2 h-4 w-40" />
            ) : (
              <div className="mt-2 text-sm text-slate-900">
                {data?.deadline_at ? new Date(data.deadline_at).toLocaleString() : "—"}
                {deadlineCountdown ? (
                  <div className={isLate ? "mt-1 text-xs text-red-700" : "mt-1 text-xs text-slate-600"}>
                    {isLate ? "Overdue by" : "Time remaining"}: {deadlineCountdown.replace("-", "")}
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Assigned Officer</div>
            {loading ? <Skeleton className="mt-2 h-4 w-56" /> : <div className="mt-2 font-mono text-xs">{data?.assigned_to ?? "—"}</div>}
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Escalation</div>
            {loading ? (
              <Skeleton className="mt-2 h-4 w-64" />
            ) : escalated ? (
              <div className="mt-2 text-sm text-slate-900">
                <div>{data?.escalation_reason ?? "Escalated"}</div>
                <div className="mt-1 text-xs text-slate-600">
                  Escalated at: {data?.escalated_at ? new Date(data.escalated_at).toLocaleString() : "—"}
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-600">Not escalated</div>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {!data ? (
            <div className="text-sm text-slate-600">—</div>
          ) : (
            <>
              {(canAccept || canStart || canResolve) ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  {canAccept ? (
                    <Button
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        setError(null);
                        try {
                          const updated = await acceptComplaint(data.id);
                          setData(updated);
                          setActions(await getComplaintActions(data.id));
                        } catch (e: any) {
                          setError(e?.message || "Failed to accept job.");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {busy ? "Processing…" : "Accept Job"}
                    </Button>
                  ) : null}

                  {canStart ? (
                    <Button
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        setError(null);
                        try {
                          const updated = await startComplaint(data.id);
                          setData(updated);
                          setActions(await getComplaintActions(data.id));
                        } catch (e: any) {
                          setError(e?.message || "Failed to start work.");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {busy ? "Processing…" : "Start Work"}
                    </Button>
                  ) : null}

                  {canResolve ? (
                    <div className="flex-1">
                      <Label htmlFor="proof_url">Proof URL (optional)</Label>
                      <Input
                        id="proof_url"
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                        placeholder="https://... (photo/report)"
                      />
                      <Button
                        className="mt-2"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          setError(null);
                          try {
                            const updated = await resolveComplaint(data.id, proofUrl || null);
                            setData(updated);
                            setActions(await getComplaintActions(data.id));
                          } catch (e: any) {
                            setError(e?.message || "Failed to mark resolved.");
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        {busy ? "Processing…" : "Mark Resolved"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : status === "RESOLVED" ? (
                <Alert tone="info" title="Waiting for confirmation">
                  The officer has marked this complaint as resolved. Citizen confirmation is required to close (or it will auto-close after timeout).
                </Alert>
              ) : null}

              {(canCitizenConfirm || canCitizenReject) ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label htmlFor="citizen_email">Citizen email (if used during submission)</Label>
                    <Input
                      id="citizen_email"
                      value={citizenEmail}
                      onChange={(e) => setCitizenEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={async () => {
                        if (!data) return;
                        setBusy(true);
                        setError(null);
                        try {
                          const updated = await confirmComplaint(data.id, citizenEmail || null);
                          setData(updated);
                          setActions(await getComplaintActions(data.id));
                        } catch (e: any) {
                          setError(e?.message || "Failed to confirm resolution.");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Confirm Resolution
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={async () => {
                        if (!data) return;
                        setBusy(true);
                        setError(null);
                        try {
                          const updated = await rejectComplaint(data.id, citizenEmail || null, rejectReason || null);
                          setData(updated);
                          setActions(await getComplaintActions(data.id));
                        } catch (e: any) {
                          setError(e?.message || "Failed to reject resolution.");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Reject Resolution
                    </Button>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="reject_reason">Rejection reason (optional)</Label>
                    <Textarea
                      id="reject_reason"
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Describe what is still unresolved."
                    />
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Complaint Content</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Description</div>
            {loading ? <Skeleton className="mt-2 h-20 w-full" /> : <p className="mt-2 whitespace-pre-wrap text-sm text-slate-900">{data?.description ?? "—"}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Location</div>
              {loading ? <Skeleton className="mt-2 h-4 w-72" /> : <div className="mt-2 text-sm text-slate-900">—</div>}
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Tracking Email</div>
              {loading ? <Skeleton className="mt-2 h-4 w-56" /> : <div className="mt-2 text-sm text-slate-900">—</div>}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Timeline</div>
              {loading ? (
                <Skeleton className="mt-2 h-28 w-full" />
              ) : (
                <dl className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-slate-600">Created</dt>
                    <dd className="text-slate-900">{data?.created_at ? new Date(data.created_at).toLocaleString() : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Assigned</dt>
                    <dd className="text-slate-900">{data?.assigned_at ? new Date(data.assigned_at).toLocaleString() : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Accepted</dt>
                    <dd className="text-slate-900">{data?.accepted_at ? new Date(data.accepted_at).toLocaleString() : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Started</dt>
                    <dd className="text-slate-900">{data?.started_at ? new Date(data.started_at).toLocaleString() : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Resolved</dt>
                    <dd className="text-slate-900">{data?.resolved_at ? new Date(data.resolved_at).toLocaleString() : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Closed</dt>
                    <dd className="text-slate-900">{data?.closed_at ? new Date(data.closed_at).toLocaleString() : "—"}</dd>
                  </div>
                </dl>
              )}
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Last Updated</div>
              {loading ? <Skeleton className="mt-2 h-4 w-48" /> : <div className="mt-2 text-sm text-slate-900">{meta.updated}</div>}
              <div className="mt-1 text-xs text-slate-500">Created: {meta.created}</div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Timeline</CardTitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Skeleton className="h-36 w-full" />
          ) : actions.length === 0 ? (
            <div className="text-sm text-slate-600">No actions recorded yet.</div>
          ) : (
            <ol className="space-y-3">
              {actions.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <div aria-hidden className="mt-1 h-2.5 w-2.5 rounded-full bg-gov-accent" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900">{a.action_type}</div>
                    <div className="text-xs text-slate-600">
                      {a.timestamp ? new Date(a.timestamp).toLocaleString() : "—"}
                      {a.user_id ? <span className="ml-2 font-mono">user:{a.user_id}</span> : null}
                    </div>
                    {a.payload ? (
                      <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">
                        {JSON.stringify(a.payload, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

