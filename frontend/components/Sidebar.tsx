"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { getCurrentUser } from "@/lib/auth";

type NavItem = { href: string; label: string };

function getNavItems(role?: string): NavItem[] {
  if (role === "admin") {
    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/complaints", label: "Complaint List" },
      { href: "/work-orders", label: "Work Orders" },
      { href: "/analytics", label: "Analytics" },
      { href: "/logs", label: "Audit Logs" },
      { href: "/admin/users", label: "User Management" },
      { href: "/admin/settings", label: "Admin Settings" },
    ];
  }
  if (role === "supervisor") {
    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/complaints", label: "Complaint List" },
      { href: "/work-orders", label: "Work Orders" },
      { href: "/analytics", label: "Analytics" },
      { href: "/logs", label: "Audit Logs" },
    ];
  }
  if (role === "worker") {
    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/complaints", label: "Complaint List" },
      { href: "/work-orders", label: "Work Orders" },
      { href: "/logs", label: "Audit Logs" },
    ];
  }
  // public — also the SSR placeholder (consistent server/client first render)
  return [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/submit", label: "Submit Complaint" },
    { href: "/status", label: "Track Status" },
  ];
}

export function Sidebar() {
  const pathname = usePathname();

  // `mounted` prevents rendering role-aware nav during SSR.
  // Before mount we render the same structure as the server (public nav)
  // so React hydrates without mismatches, then swaps to the real nav.
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    const user = getCurrentUser();
    setRole(user?.role);
    setMounted(true);
  }, []);

  // Pre-mount: use public nav (same as SSR).
  // Post-mount: use role-appropriate nav.
  const items = mounted ? getNavItems(role) : getNavItems(undefined);

  return (
    <aside className="w-72 bg-gov-primary text-white hidden md:flex md:flex-col">
      <div className="h-14 px-5 flex items-center gap-3 border-b border-white/10">
        <div aria-hidden className="h-8 w-8 rounded-md bg-white/10" />
        <div className="leading-tight">
          <div className="font-semibold tracking-wide">SISPAA Router</div>
          <div className="text-[11px] text-white/70">Malaysia GovTech UI</div>
        </div>
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
        For internal government use. Prototype UI.
      </div>
    </aside>
  );
}
