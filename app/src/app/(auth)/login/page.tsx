import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-hero-grid bg-[length:auto,34px_34px,34px_34px]" />
      <div className="noise-overlay opacity-30" />
      <div className="relative w-full max-w-7xl">
        <div className="grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
          <section className="fade-up overflow-hidden rounded-lg border border-white/[0.15] bg-ink text-white shadow-lift">
            <div
              className="relative min-h-[520px] p-7 lg:p-10"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(11,18,32,0.96), rgba(11,18,32,0.72) 58%, rgba(11,18,32,0.32)), url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80')",
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            >
              <div className="max-w-2xl">
                <span className="inline-flex rounded-full border border-white/[0.15] bg-white/10 px-4 py-1 text-xs font-semibold uppercase text-sea-100 backdrop-blur">
                  Maskana
                </span>
                <h1 className="mt-8 text-4xl font-bold text-white lg:text-6xl">
                  Real estate CRM built like an executive trading desk.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-8 text-slate-200 lg:text-lg">
                  Pipeline intelligence, listing operations, and client communication in one polished workspace.
                </p>
              </div>

              <div className="absolute bottom-7 left-7 right-7 grid gap-3 md:grid-cols-3">
                {[
                  { label: "Pipeline", value: "87 leads" },
                  { label: "Listings", value: "$18.4M" },
                  { label: "AI Score", value: "92%" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-white/[0.15] bg-white/[0.12] p-4 backdrop-blur-xl">
                    <p className="text-xs font-semibold uppercase text-slate-300">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-0 border-t border-white/10 bg-white/[0.06] md:grid-cols-3">
              {[
                { role: "Admin", email: "admin@horizonrealty.com" },
                { role: "Manager", email: "manager@horizonrealty.com" },
                { role: "Agent", email: "agent@horizonrealty.com" },
              ].map((item) => (
                <div key={item.role} className="border-white/10 p-5 md:border-r">
                  <p className="text-sm font-semibold text-white">{item.role}</p>
                  <p className="mt-1 break-all text-sm text-slate-300">{item.email}</p>
                </div>
              ))}
            </div>
          </section>
          <Suspense fallback={<section className="glass-panel p-8">Loading secure access...</section>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
