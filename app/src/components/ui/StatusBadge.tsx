import { cn } from "@/lib/utils";

const badgeMap: Record<string, string> = {
  NEW: "border-slate-200 bg-slate-100 text-slate-700 before:bg-slate-500",
  CONTACTED: "border-sky-200 bg-sky-100 text-sky-700 before:bg-sky-500",
  QUALIFIED: "border-amber-200 bg-amber-100 text-amber-800 before:bg-amber-500",
  VISIT: "border-violet-200 bg-violet-100 text-violet-700 before:bg-violet-500",
  CLOSED: "border-emerald-200 bg-emerald-100 text-emerald-700 before:bg-emerald-500",
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700 before:bg-slate-500",
  ACTIVE: "border-teal-200 bg-teal-100 text-teal-700 before:bg-teal-500",
  UNDER_OFFER: "border-orange-200 bg-orange-100 text-orange-700 before:bg-orange-500",
  SOLD: "border-emerald-200 bg-emerald-100 text-emerald-700 before:bg-emerald-500",
  ARCHIVED: "border-zinc-200 bg-zinc-100 text-zinc-700 before:bg-zinc-500",
  ADMIN: "border-rose-200 bg-rose-100 text-rose-700 before:bg-rose-500",
  MANAGER: "border-indigo-200 bg-indigo-100 text-indigo-700 before:bg-indigo-500",
  AGENT: "border-sea-200 bg-sea-100 text-sea-700 before:bg-sea-500",
  EMAIL: "border-blue-200 bg-blue-100 text-blue-700 before:bg-blue-500",
  WHATSAPP: "border-emerald-200 bg-emerald-100 text-emerald-700 before:bg-emerald-500",
  hot: "border-rose-200 bg-rose-100 text-rose-700 before:bg-rose-500",
  warm: "border-amber-200 bg-amber-100 text-amber-800 before:bg-amber-500",
  cold: "border-sky-200 bg-sky-100 text-sky-700 before:bg-sky-500",
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = value ?? "N/A";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold capitalize shadow-sm before:h-1.5 before:w-1.5 before:rounded-full",
        badgeMap[label] ?? "border-slate-200 bg-slate-100 text-slate-700 before:bg-slate-500",
      )}
    >
      {label.replaceAll("_", " ").toLowerCase()}
    </span>
  );
}
