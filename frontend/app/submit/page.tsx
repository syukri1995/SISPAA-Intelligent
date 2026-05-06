"use client";

import { useState } from "react";
import { postComplaint } from "@/lib/api";
import type { ComplaintStatus } from "@/types/complaint";
import { WorkflowStepper } from "@/components/WorkflowStepper";

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-5">
        <div className="font-medium text-slate-900">Submit Complaint</div>
        <div className="mt-4 space-y-3">
          <label className="block">
            <div className="text-sm text-slate-700 mb-1">Complaint text</div>
            <textarea
              name="complaint"
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-cyan-300"
              placeholder="Describe the issue clearly. Include landmark and urgency if any."
            />
          </label>
          <label className="block">
            <div className="text-sm text-slate-700 mb-1">Location (optional)</div>
            <input
              name="location"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-300"
              placeholder="e.g., Jalan Tun Razak, Kuala Lumpur"
            />
          </label>
          <label className="block">
            <div className="text-sm text-slate-700 mb-1">Tracking email (optional)</div>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-300"
              placeholder="you@example.com"
            />
            <div className="mt-1 text-xs text-slate-500">Leave blank if you do not want status updates by email.</div>
          </label>
          <label className="block">
            <div className="text-sm text-slate-700 mb-1">Image URL (optional)</div>
            <input
              name="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-300"
              placeholder="https://..."
            />
          </label>

          {complaintText.length > 0 && complaintText.trim().length < 10 ? (
            <div className="text-sm text-yellow-600">Please provide more details</div>
          ) : null}
          {err ? <div className="text-sm text-red-700">{err}</div> : null}

          <button
            type="submit"
            disabled={loading}
            onClick={async () => {
              setErr(null);
              if (complaintText.trim().length === 0) {
                setErr("Complaint is required");
                return;
              }
              if (complaintText.trim().length < 5) {
                setErr("Please provide more details");
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
            className="w-full rounded-lg bg-gov-primary text-white py-2.5 text-sm font-medium hover:opacity-95 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Submit & Process"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <WorkflowStepper active={result?.current_step ?? (loading ? "Reason" : "Complaint")} confidence={result?.confidence ?? null} />

        <div className="card p-5 results-panel">
          <div className="font-medium text-slate-900">Result</div>
          {!result ? (
            <div className="mt-2 text-sm text-slate-600">Submit a complaint to see classification, routing, and work order details.</div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="text-slate-600">Category</div>
              <div className="font-medium">{result.category ?? "—"}</div>
              <div className="text-slate-600">Agency</div>
              <div className="font-medium">{result.agency ?? "—"}</div>
              <div className="text-slate-600">Confidence</div>
              <div className="font-medium">{result.confidence != null ? result.confidence.toFixed(2) : "—"}</div>
              <div className="text-slate-600">Work Order ID</div>
              <div className="font-mono text-xs work-order-id">{result.work_order_id ?? "—"}</div>
              <div className="text-slate-600">Priority</div>
              <div className="font-medium">{result.priority ?? "—"}</div>
            </div>
          )}
        </div>

        {result?.citizen_email_preview ? (
          <div className="card p-5">
            <div className="font-medium text-slate-900">Citizen Email (Preview)</div>
            <pre className="mt-3 whitespace-pre-wrap text-xs bg-slate-50 border border-slate-200 rounded-lg p-3">
              {result.citizen_email_preview}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}

