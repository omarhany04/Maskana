"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <header className="glass-panel px-5 py-4">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sea-700">Command Center</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">Portfolio and pipeline operations</h1>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3">
            <div className="h-10 w-10 rounded-2xl bg-sea-100" />
            <div>
              <p className="text-sm font-semibold text-slate-700">{user.name}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{user.role}</p>
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
                  "whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition",
                  pathname.startsWith(item.href)
                    ? "bg-sea-600 text-white"
                    : "bg-white text-slate-600 hover:bg-sea-50 hover:text-sea-700",
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
