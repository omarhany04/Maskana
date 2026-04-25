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
    <aside className="sticky top-3 hidden h-[calc(100vh-1.5rem)] w-[292px] shrink-0 flex-col overflow-hidden rounded-lg border border-white/70 bg-white/[0.76] p-3 shadow-soft backdrop-blur-xl lg:flex">
      <div className="scanline overflow-hidden rounded-lg bg-ink p-5 text-white shadow-lift">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/10 shadow-inner">
            <Building2 className="h-6 w-6 text-sea-200" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-sea-200">Brokerage OS</p>
            <h2 className="text-xl font-bold">Maskana</h2>
          </div>
        </div>
        <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
          <p className="truncate text-sm font-semibold text-sea-100">{user.name}</p>
          <p className="mt-1 text-xs font-bold uppercase text-white/60">{user.role}</p>
          <p className="mt-2 truncate text-xs text-white/70">{user.email}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="metric-tile">
          <p className="text-lg font-bold text-ink">Live</p>
          <p className="text-xs text-slate-500">Workspace</p>
        </div>
        <div className="metric-tile">
          <p className="text-lg font-bold text-sea-700">AI</p>
          <p className="text-xs text-slate-500">Ready</p>
        </div>
      </div>

      <nav className="mt-5 space-y-1.5">
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
                  "group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition duration-200",
                  isActive
                    ? "bg-ink text-white shadow-glow"
                    : "text-slate-600 hover:translate-x-1 hover:bg-sea-50 hover:text-sea-800 hover:shadow-crisp",
                )}
              >
                {isActive ? <span className="absolute left-0 h-7 w-1 rounded-r-full bg-sea-300" /> : null}
                <Icon className={cn("h-4 w-4", isActive ? "text-sea-200" : "text-slate-400 group-hover:text-sea-700")} />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-auto flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:shadow-crisp"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </aside>
  );
}
