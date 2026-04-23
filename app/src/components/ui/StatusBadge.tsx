import { cn } from "@/lib/utils";

const badgeMap: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-sky-100 text-sky-700",
  QUALIFIED: "bg-amber-100 text-amber-700",
  VISIT: "bg-violet-100 text-violet-700",
  CLOSED: "bg-emerald-100 text-emerald-700",
  DRAFT: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-teal-100 text-teal-700",
  UNDER_OFFER: "bg-orange-100 text-orange-700",
  SOLD: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-zinc-100 text-zinc-700",
  ADMIN: "bg-rose-100 text-rose-700",
  MANAGER: "bg-indigo-100 text-indigo-700",
  AGENT: "bg-sea-100 text-sea-700",
  hot: "bg-rose-100 text-rose-700",
  warm: "bg-amber-100 text-amber-700",
  cold: "bg-sky-100 text-sky-700",
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = value ?? "N/A";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize tracking-wide",
        badgeMap[label] ?? "bg-slate-100 text-slate-700",
      )}
    >
      {label.replaceAll("_", " ").toLowerCase()}
    </span>
  );
}

