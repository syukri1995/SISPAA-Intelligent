import { cn } from "@/lib/cn";

export function KPIcard(props: { title: string; value: string; sub?: string; tone?: "good" | "warn" | "info" }) {
  const tone =
    props.tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : props.tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-slate-200 bg-white text-slate-900";

  return (
    <div className={cn("card p-4", tone)}>
      <div className="text-xs uppercase tracking-wide text-slate-600">{props.title}</div>
      <div className="mt-2 text-2xl font-semibold">{props.value}</div>
      {props.sub ? <div className="mt-1 text-xs text-slate-600">{props.sub}</div> : null}
    </div>
  );
}

