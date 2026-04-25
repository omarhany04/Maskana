export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-panel fade-up px-5 py-5 sm:px-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-sea-300 via-gold-300 to-signal-violet" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-sea-200/70 bg-sea-50/80 px-3 py-1 text-xs font-bold uppercase text-sea-800">
            <span className="h-1.5 w-1.5 rounded-full bg-sea-500" />
            {eyebrow}
          </div>
          <h2 className="mt-3 max-w-4xl text-3xl font-bold text-ink lg:text-[2.35rem] lg:leading-tight">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
