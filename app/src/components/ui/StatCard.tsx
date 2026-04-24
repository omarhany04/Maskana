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
    <div className="glass-panel group overflow-hidden p-5">
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-sea-400 via-signal-blue to-gold-300 opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
        </div>
        <div className={`rounded-lg p-3 shadow-sm transition group-hover:-translate-y-1 ${accent}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}
