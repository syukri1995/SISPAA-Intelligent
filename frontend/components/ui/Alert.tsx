import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "warn" | "danger" | "success";

export function Alert({
  tone = "info",
  title,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone; title?: ReactNode }) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        tone === "info" && "border-cyan-200 bg-cyan-50 text-cyan-900",
        tone === "warn" && "border-amber-200 bg-amber-50 text-amber-950",
        tone === "danger" && "border-red-200 bg-red-50 text-red-900",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-950",
        className
      )}
      {...props}
    >
      {title ? <div className="font-semibold">{title}</div> : null}
      {children ? <div className={cn(title ? "mt-1 text-slate-700" : "")}>{children}</div> : null}
    </div>
  );
}

