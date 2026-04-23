import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 bg-hero-grid" />
      <div className="absolute -left-10 top-10 h-56 w-56 rounded-full bg-sea-200/50 blur-3xl" />
      <div className="absolute -bottom-12 right-0 h-72 w-72 rounded-full bg-gold-100/60 blur-3xl" />
      <div className="relative w-full max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="glass-panel p-8 lg:p-12">
            <span className="inline-flex rounded-full bg-sea-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sea-700">
              Maskana
            </span>
            <div className="mt-8 max-w-2xl space-y-5">
              <h1 className="text-4xl font-bold tracking-tight text-ink lg:text-6xl">
                Maskana powers tenant-isolated CRM operations with AI-native deal flow.
              </h1>
              <p className="text-lg leading-8 text-slate-600">
                Manage leads, listings, teams, commissions, and conversational AI workflows from a
                single workspace designed for brokerages and agencies.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { label: "Multi-Tenant", value: "Strict company isolation" },
                { label: "AI Services", value: "Lead scoring, search, chat" },
                { label: "AWS Ready", value: "S3, Docker, EC2 deployment" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-3xl bg-ink p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sea-200">Seeded access</p>
              <div className="mt-3 grid gap-3 text-sm text-slate-200 md:grid-cols-3">
                <div>
                  <p className="font-semibold text-white">Admin</p>
                  <p>admin@horizonrealty.com</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Manager</p>
                  <p>manager@horizonrealty.com</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Agent</p>
                  <p>agent@horizonrealty.com</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-sea-100">Password: Password123!</p>
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
