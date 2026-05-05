import { cn } from "@/lib/cn";

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
      <div className="h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-gov-accent" />
          <div className="font-semibold text-slate-900">SISPAA Intelligent Router</div>
          <span
            className={cn(
              "ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              "bg-emerald-50 text-emerald-700 border border-emerald-200"
            )}
          >
            Active
          </span>
        </div>
        <div className="text-sm text-slate-600">
          <span className="font-medium text-slate-900">Admin Officer</span>
        </div>
      </div>
    </header>
  );
}

