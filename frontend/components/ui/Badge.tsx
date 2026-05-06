import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "good" | "warn" | "info" | "danger";

export function Badge({ className, tone = "neutral", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        tone === "neutral" && "border-slate-200 bg-slate-50 text-slate-700",
        tone === "good" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "warn" && "border-amber-200 bg-amber-50 text-amber-800",
        tone === "info" && "border-cyan-200 bg-cyan-50 text-cyan-800",
        tone === "danger" && "border-red-200 bg-red-50 text-red-700",
        className
      )}
      {...props}
    />
  );
}

