"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, LogOut, MapPinned, Settings, Users2, UserRoundSearch } from "lucide-react";
import { signOut } from "next-auth/react";

import type { Role, SessionUser } from "@real-estate-crm/shared";

import { cn } from "@/lib/utils";

const navItems: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "AGENT"] },
  { href: "/leads", label: "Leads", icon: UserRoundSearch, roles: ["ADMIN", "MANAGER", "AGENT"] },
  { href: "/properties", label: "Properties", icon: MapPinned, roles: ["ADMIN", "MANAGER", "AGENT"] },
  { href: "/users", label: "Users", icon: Users2, roles: ["ADMIN"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN", "MANAGER", "AGENT"] },
];

export function WorkspaceSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  return (
    <aside className="glass-panel hidden w-[290px] shrink-0 flex-col p-5 lg:flex">
      <div className="rounded-3xl bg-ink p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <Building2 className="h-6 w-6 text-sea-200" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-sea-200">Brokerage OS</p>
            <h2 className="text-xl font-bold">Maskana</h2>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-sea-100">{user.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/60">{user.role}</p>
          <p className="mt-2 text-xs text-white/70">{user.email}</p>
        </div>
      </div>

      <nav className="mt-6 space-y-2">
        {navItems
          .filter((item) => item.roles.includes(user.role))
          .map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive ? "bg-sea-600 text-white shadow-soft" : "text-slate-600 hover:bg-sea-50 hover:text-sea-700",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-auto flex items-center gap-3 rounded-2xl border border-slate-200/80 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </aside>
  );
}
