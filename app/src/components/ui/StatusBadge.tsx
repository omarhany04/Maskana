import { cn } from "@/lib/utils";

const badgeMap: Record<string, string> = {
  NEW: "border-slate-200 bg-slate-100 text-slate-700",
  CONTACTED: "border-sky-200 bg-sky-100 text-sky-700",
  QUALIFIED: "border-amber-200 bg-amber-100 text-amber-800",
  VISIT: "border-violet-200 bg-violet-100 text-violet-700",
  CLOSED: "border-emerald-200 bg-emerald-100 text-emerald-700",
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  ACTIVE: "border-teal-200 bg-teal-100 text-teal-700",
  UNDER_OFFER: "border-orange-200 bg-orange-100 text-orange-700",
  SOLD: "border-emerald-200 bg-emerald-100 text-emerald-700",
  ARCHIVED: "border-zinc-200 bg-zinc-100 text-zinc-700",
  ADMIN: "border-rose-200 bg-rose-100 text-rose-700",
  MANAGER: "border-indigo-200 bg-indigo-100 text-indigo-700",
  AGENT: "border-sea-200 bg-sea-100 text-sea-700",
  hot: "border-rose-200 bg-rose-100 text-rose-700",
  warm: "border-amber-200 bg-amber-100 text-amber-800",
  cold: "border-sky-200 bg-sky-100 text-sky-700",
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = value ?? "N/A";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize shadow-sm",
        badgeMap[label] ?? "border-slate-200 bg-slate-100 text-slate-700",
      )}
    >
      {label.replaceAll("_", " ").toLowerCase()}
    </span>
  );
}
