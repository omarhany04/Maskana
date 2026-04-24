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
    <div className="glass-panel fade-up overflow-hidden px-6 py-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sea-400 via-gold-300 to-signal-violet" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-sea-700">{eyebrow}</p>
          <h2 className="mt-2 max-w-4xl text-3xl font-bold text-ink lg:text-4xl">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </div>
  );
}
