import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-ink px-4 py-6 text-white sm:px-6 lg:px-8">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(16,21,34,0.94), rgba(16,21,34,0.78) 42%, rgba(16,21,34,0.34)), url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=82')",
        }}
      />
      <div className="noise-overlay opacity-30" />
      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="fade-up max-w-3xl py-8">
          <span className="inline-flex rounded-full border border-white/[0.18] bg-white/10 px-4 py-1 text-xs font-bold uppercase text-sea-100 backdrop-blur">
            Maskana
          </span>
          <h1 className="mt-8 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Real estate CRM built for serious pipeline control.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 lg:text-lg">
            Pipeline intelligence, listing operations, and client communication in one polished brokerage workspace.
          </p>

          <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              { label: "Pipeline", value: "87 leads" },
              { label: "Listings", value: "$18.4M" },
              { label: "AI score", value: "92%" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-white/[0.16] bg-white/[0.12] p-4 shadow-lift backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.16]"
              >
                <p className="text-xs font-bold uppercase text-slate-300">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid max-w-3xl gap-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.08] backdrop-blur md:grid-cols-3">
            {[
              { role: "Admin", email: "admin@horizonrealty.com" },
              { role: "Manager", email: "manager@horizonrealty.com" },
              { role: "Agent", email: "agent@horizonrealty.com" },
            ].map((item) => (
              <div key={item.role} className="border-white/10 p-4 md:border-r">
                <p className="text-sm font-bold text-white">{item.role}</p>
                <p className="mt-1 break-all text-sm text-slate-300">{item.email}</p>
              </div>
            ))}
          </div>
        </section>

        <Suspense fallback={<section className="glass-panel p-8 text-ink">Loading secure access...</section>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
