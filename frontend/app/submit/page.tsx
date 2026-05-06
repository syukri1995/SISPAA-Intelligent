"use client";

import { useState } from "react";
import { postComplaint } from "@/lib/api";
import type { ComplaintStatus } from "@/types/complaint";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Hint, Input, Label, Textarea } from "@/components/ui/FormControls";
import { Badge } from "@/components/ui/Badge";

export default function SubmitPage() {
  const [complaintText, setComplaintText] = useState("");
  const [locationText, setLocationText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<ComplaintStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const trackingEmail = email.trim();
  const emailForSubmission = trackingEmail && trackingEmail.includes("@") ? trackingEmail : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Submit Complaint"
        description="Provide clear details so the system can classify and route your complaint accurately."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Complaint Form</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {err ? <Alert tone="danger" title="Submission failed">{err}</Alert> : null}

            <div>
              <Label htmlFor="complaint_text">Complaint text</Label>
              <Textarea
                id="complaint_text"
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                rows={9}
                placeholder="Describe the issue. Include landmark, time, and urgency."
              />
              {complaintText.length > 0 && complaintText.trim().length < 10 ? (
                <Hint className="text-amber-700">Please provide more details (at least 10 characters).</Hint>
              ) : (
                <Hint>Write in Bahasa Melayu or English. Avoid sensitive personal details.</Hint>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="location_text">Location (optional)</Label>
                <Input
                  id="location_text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="e.g., Jalan Tun Razak, Kuala Lumpur"
                />
              </div>
              <div>
                <Label htmlFor="email">Tracking email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <Hint>Used for status lookup and updates.</Hint>
              </div>
            </div>

            <div>
              <Label htmlFor="image_url">Image URL (optional)</Label>
              <Input
                id="image_url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
              <Hint>If you have a photo, upload it elsewhere and paste the URL.</Hint>
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={loading}
              onClick={async () => {
                setErr(null);
                if (complaintText.trim().length === 0) {
                  setErr("Complaint text is required.");
                  return;
                }
                if (complaintText.trim().length < 10) {
                  setErr("Please provide more details (at least 10 characters).");
                  return;
                }
                setLoading(true);
                setResult(null);
                try {
                  const r = await postComplaint({
                    complaint_text: complaintText,
                    location_text: locationText || null,
                    image_url: imageUrl || null,
                    email: emailForSubmission
                  });
                  setResult(r);
                } catch (e: any) {
                  setErr("Failed to submit complaint. Please try again.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Processing…" : "Submit & Process"}
            </Button>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <WorkflowStepper
            active={result?.current_step ?? (loading ? "Reason" : "Complaint")}
            confidence={result?.confidence ?? null}
          />

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Result</CardTitle>
              {result?.status ? <Badge tone={result.status === "COMPLETED" ? "good" : "neutral"}>{result.status}</Badge> : null}
            </CardHeader>
            <CardBody>
              {!result ? (
                <div className="text-sm text-slate-600">Submit a complaint to see classification, routing, and work order details.</div>
              ) : (
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-600">Category</dt>
                    <dd className="mt-1 font-medium text-slate-900">{result.category ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Agency</dt>
                    <dd className="mt-1 font-medium text-slate-900">{result.agency ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Confidence</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {result.confidence != null ? result.confidence.toFixed(2) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Priority</dt>
                    <dd className="mt-1 font-medium text-slate-900">{result.priority ?? "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-slate-600">Work Order ID</dt>
                    <dd className="mt-1 font-mono text-xs text-slate-900 break-all">{result.work_order_id ?? "—"}</dd>
                  </div>
                </dl>
              )}
            </CardBody>
          </Card>

          {result?.citizen_email_preview ? (
            <Card>
              <CardHeader>
                <CardTitle>Citizen Email (Preview)</CardTitle>
              </CardHeader>
              <CardBody>
                <pre className="whitespace-pre-wrap text-xs bg-slate-50 border border-slate-200 rounded-lg p-3">
                  {result.citizen_email_preview}
                </pre>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

