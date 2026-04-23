import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
  detail: string;
}) {
  return (
    <div className="glass-panel p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
          <p className="mt-2 text-sm text-slate-600">{detail}</p>
        </div>
        <div className={`rounded-2xl p-3 ${accent}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

