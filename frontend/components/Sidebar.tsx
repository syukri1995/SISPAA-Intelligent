"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { getCurrentUser } from "@/lib/auth";

export function Sidebar() {
  const pathname = usePathname();
  const user = getCurrentUser();

  const items =
    user?.role === "admin"
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/admin", label: "Admin Home" },
          { href: "/admin/users", label: "Users" },
          { href: "/admin/analytics", label: "Analytics" },
          { href: "/logs", label: "Logs" },
          { href: "/work-orders", label: "Work Orders" },
          { href: "/submit", label: "Submit Complaint" },
        ]
      : user?.role === "supervisor"
        ? [
            { href: "/dashboard", label: "Dashboard" },
            { href: "/work-orders", label: "Work Orders" },
            { href: "/logs", label: "Logs" },
            { href: "/submit", label: "Submit Complaint" },
          ]
        : user?.role === "worker"
          ? [
              { href: "/dashboard", label: "Dashboard" },
              { href: "/work-orders", label: "Work Orders" },
              { href: "/submit", label: "Submit Complaint" },
              { href: "/logs", label: "Logs" },
            ]
          : [
              { href: "/dashboard", label: "Dashboard" },
              { href: "/submit", label: "Submit Complaint" },
              { href: "/status", label: "Track Status" },
            ];

  return (
    <aside className="w-64 bg-gov-primary text-white hidden md:flex md:flex-col">
      <div className="h-14 px-5 flex items-center border-b border-white/10">
        <div className="font-semibold tracking-wide">SISPAA Router</div>
      </div>
      <nav className="p-3 space-y-1">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10 hover:text-white",
              pathname === it.href && "bg-white/15 text-white",
              "transition"
            )}
          >
            {it.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4 text-xs text-white/70 border-t border-white/10">
        Government-grade prototype UI
      </div>
    </aside>
  );
}

