"use client";

import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";
import { getCurrentUser, clearAuthSession, type CurrentUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/login");
  };

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
            {user?.role ?? "Guest"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="font-medium text-slate-900">
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Guest"}
          </span>
          {user ? (
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

