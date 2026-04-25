"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CircleUserRound, Sparkles } from "lucide-react";

import type { Role, SessionUser } from "@real-estate-crm/shared";

import { cn } from "@/lib/utils";

const navItems: Array<{
  href: string;
  label: string;
  roles: Role[];
}> = [
  { href: "/dashboard", label: "Dashboard", roles: ["ADMIN", "MANAGER", "AGENT"] },
  { href: "/leads", label: "Leads", roles: ["ADMIN", "MANAGER", "AGENT"] },
  { href: "/properties", label: "Properties", roles: ["ADMIN", "MANAGER", "AGENT"] },
  { href: "/users", label: "Users", roles: ["ADMIN"] },
  { href: "/settings", label: "Settings", roles: ["ADMIN", "MANAGER", "AGENT"] },
];

export function WorkspaceTopbar({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  return (
    <header className="glass-panel fade-up px-5 py-4">
      <div className="relative space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sea-200/70 bg-sea-50/80 px-3 py-1 text-xs font-bold uppercase text-sea-800">
              <Activity className="h-4 w-4" />
              Command Center
            </div>
            <h1 className="mt-2 text-2xl font-bold text-ink">Portfolio and pipeline operations</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-sea-200/70 bg-sea-50/80 px-4 py-3 text-sm font-bold text-sea-800 shadow-sm md:flex">
              <Sparkles className="h-4 w-4" />
              AI workspace active
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white/[0.9] px-4 py-3 shadow-crisp">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white shadow-glow">
                <CircleUserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{user.name}</p>
                <p className="text-xs font-bold uppercase text-slate-500">{user.role}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto lg:hidden">
          {navItems
            .filter((item) => item.roles.includes(user.role))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition",
                  pathname.startsWith(item.href)
                    ? "bg-ink text-white shadow-glow"
                    : "bg-white text-slate-600 shadow-sm hover:bg-sea-50 hover:text-sea-700",
                )}
              >
                {item.label}
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
