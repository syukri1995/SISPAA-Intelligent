import { cn } from "@/lib/cn";

const steps = ["Complaint", "Sense", "Reason", "Act", "Completed"] as const;

export function WorkflowStepper(props: { active?: string | null; confidence?: number | null }) {
  const activeIndex = Math.max(
    0,
    steps.findIndex((s) => s.toLowerCase() === (props.active || "").toLowerCase())
  );

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="font-medium text-slate-900">Live Workflow</div>
        <div className="text-sm text-slate-600">
          Confidence:{" "}
          <span className={cn("font-semibold", (props.confidence ?? 0) >= 0.7 ? "text-emerald-700" : "text-amber-700")}>
            {props.confidence != null ? props.confidence.toFixed(2) : "—"}
          </span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {steps.map((s, i) => {
          const isActive = i === activeIndex;
          const isDone = i < activeIndex;
          return (
            <div
              key={s}
              className={cn(
                "rounded-lg border px-2 py-2 text-center text-xs font-medium",
                isActive
                  ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                  : isDone
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-500"
              )}
            >
              {s}
            </div>
          );
        })}
      </div>
    </div>
  );
}

