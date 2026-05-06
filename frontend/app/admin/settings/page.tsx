"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Hint, Input, Label, Select } from "@/components/ui/FormControls";
import { Badge } from "@/components/ui/Badge";

type SettingsState = {
  slaHoursLow: number;
  slaHoursMedium: number;
  slaHoursHigh: number;
  confidenceThreshold: number;
  notifyMode: "none" | "email";
};

const STORAGE_KEY = "sispaa_admin_settings_v1";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [saved, setSaved] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<SettingsState>({
    slaHoursLow: 72,
    slaHoursMedium: 24,
    slaHoursHigh: 4,
    confidenceThreshold: 0.7,
    notifyMode: "email"
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    setUser(currentUser);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      setState((prev) => ({
        ...prev,
        ...parsed
      }));
    } catch {
      // ignore
    }
  }, [router]);

  const statusBadge = useMemo(() => {
    if (saved === "saved") return <Badge tone="good">Saved</Badge>;
    if (saved === "error") return <Badge tone="danger">Not saved</Badge>;
    return <Badge tone="neutral">Draft</Badge>;
  }, [saved]);

  if (!user || user.role !== "admin") {
    return <div className="text-center py-10 text-sm text-slate-600">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Admin Settings"
        description="Configure escalation timelines and operational defaults. (Prototype: stored locally in the browser.)"
        actions={
          <>
            {statusBadge}
            <Button variant="outline" onClick={() => router.push("/admin/users")}>
              User Management
            </Button>
          </>
        }
      />

      {error ? <Alert tone="danger" title="Error">{error}</Alert> : null}

      <Alert tone="info" title="Prototype note">
        These settings are currently saved to <span className="font-medium">localStorage</span>. When you’re ready, we can wire this to a
        backend settings endpoint with audit logging and role-based access.
      </Alert>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Escalation SLAs (hours)</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <Label htmlFor="slaLow">Low</Label>
                <Input
                  id="slaLow"
                  type="number"
                  min={1}
                  max={720}
                  value={state.slaHoursLow}
                  onChange={(e) => setState((s) => ({ ...s, slaHoursLow: clamp(Number(e.target.value || 0), 1, 720) }))}
                />
                <Hint>Example: pothole minor damage.</Hint>
              </div>
              <div>
                <Label htmlFor="slaMed">Medium</Label>
                <Input
                  id="slaMed"
                  type="number"
                  min={1}
                  max={720}
                  value={state.slaHoursMedium}
                  onChange={(e) => setState((s) => ({ ...s, slaHoursMedium: clamp(Number(e.target.value || 0), 1, 720) }))}
                />
                <Hint>Example: road blockage.</Hint>
              </div>
              <div>
                <Label htmlFor="slaHigh">High</Label>
                <Input
                  id="slaHigh"
                  type="number"
                  min={1}
                  max={168}
                  value={state.slaHoursHigh}
                  onChange={(e) => setState((s) => ({ ...s, slaHoursHigh: clamp(Number(e.target.value || 0), 1, 168) }))}
                />
                <Hint>Example: safety risks.</Hint>
              </div>
            </div>
            <div className="text-sm text-slate-700">
              Escalation is triggered when a case remains <span className="font-medium">Pending / In progress</span> beyond its SLA.
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Thresholds</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <Label htmlFor="confidence">Minimum confidence for auto-routing</Label>
              <Input
                id="confidence"
                type="number"
                step="0.05"
                min={0}
                max={1}
                value={state.confidenceThreshold}
                onChange={(e) =>
                  setState((s) => ({ ...s, confidenceThreshold: clamp(Number(e.target.value || 0), 0, 1) }))
                }
              />
              <Hint>
                Below this threshold, cases should be flagged for supervisor review (hybrid routing).
              </Hint>
            </div>

            <div>
              <Label htmlFor="notify">Notification mode</Label>
              <Select
                id="notify"
                value={state.notifyMode}
                onChange={(e) => setState((s) => ({ ...s, notifyMode: e.target.value as SettingsState["notifyMode"] }))}
              >
                <option value="email">Email</option>
                <option value="none">None</option>
              </Select>
              <Hint>Email delivery depends on backend integration.</Hint>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Routing Rules (Preview)</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="text-sm text-slate-700">
            This is a read-only preview. In production, this should be backed by a rules table with versioning and audit logs.
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3 text-left font-semibold">Category</th>
                  <th className="px-5 py-3 text-left font-semibold">Default agency</th>
                  <th className="px-5 py-3 text-left font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-5 py-3">Road</td>
                  <td className="px-5 py-3">DBKL</td>
                  <td className="px-5 py-3 text-slate-600">Municipal roads, potholes, streetlights</td>
                </tr>
                <tr>
                  <td className="px-5 py-3">Transport</td>
                  <td className="px-5 py-3">APAD</td>
                  <td className="px-5 py-3 text-slate-600">Public transport, bus routes</td>
                </tr>
                <tr>
                  <td className="px-5 py-3">Health</td>
                  <td className="px-5 py-3">KKM</td>
                  <td className="px-5 py-3 text-slate-600">Public health / clinic issues</td>
                </tr>
                <tr>
                  <td className="px-5 py-3">Other</td>
                  <td className="px-5 py-3">OTHER</td>
                  <td className="px-5 py-3 text-slate-600">Manual review lane</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            try {
              setError(null);
              setSaved("idle");
              localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
              setSaved("saved");
              window.setTimeout(() => setSaved("idle"), 1500);
            } catch (e: any) {
              setSaved("error");
              setError("Failed to save settings in this browser.");
            }
          }}
        >
          Save settings
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            try {
              setError(null);
              localStorage.removeItem(STORAGE_KEY);
              setState({
                slaHoursLow: 72,
                slaHoursMedium: 24,
                slaHoursHigh: 4,
                confidenceThreshold: 0.7,
                notifyMode: "email"
              });
              setSaved("saved");
              window.setTimeout(() => setSaved("idle"), 1500);
            } catch {
              setSaved("error");
              setError("Failed to reset settings in this browser.");
            }
          }}
        >
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}

