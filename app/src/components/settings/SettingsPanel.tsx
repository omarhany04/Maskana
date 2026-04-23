"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BotMessageSquare, CalendarSync, Cloud, Mail, Save, Settings2, Smartphone } from "lucide-react";
import { z } from "zod";

import type { SessionUser } from "@real-estate-crm/shared";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";

const settingsSchema = z.object({
  name: z.string().min(2).max(120),
  brandColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  locale: z.string().min(2).max(20),
  currency: z.string().min(3).max(10),
});

type SettingsValues = z.infer<typeof settingsSchema>;

const integrationMeta = [
  { key: "ai", label: "AI service", icon: BotMessageSquare },
  { key: "s3", label: "AWS S3", icon: Cloud },
  { key: "email", label: "Email", icon: Mail },
  { key: "whatsapp", label: "WhatsApp (Twilio)", icon: Smartphone },
  { key: "googleCalendar", label: "Google Calendar", icon: CalendarSync },
  { key: "outlookCalendar", label: "Outlook Calendar", icon: CalendarSync },
] as const;

export function SettingsPanel({
  company,
  currentUser,
  integrations,
}: {
  company: {
    id: string;
    name: string;
    slug: string;
    createdAt: string | Date;
    settings: unknown;
  };
  currentUser: SessionUser;
  integrations: Record<string, boolean>;
}) {
  const rawSettings =
    company.settings && typeof company.settings === "object" && !Array.isArray(company.settings)
      ? (company.settings as Record<string, unknown>)
      : {};

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canEdit = currentUser.role !== "AGENT";

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: company.name,
      brandColor: String(rawSettings.brandColor ?? "#1E938B"),
      locale: String(rawSettings.locale ?? "en-US"),
      currency: String(rawSettings.currency ?? "USD"),
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setFeedback(null);
      const response = await fetch("/api/company/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        setFeedback(error.message ?? "Unable to update company settings.");
        return;
      }

      setFeedback("Settings saved.");
    });
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tenant settings"
        title="Company profile and integration readiness"
        description="Company-specific branding, locale, and deployment integration status for the active tenant."
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sea-700">Tenant record</p>
                <h3 className="mt-2 text-2xl font-bold text-ink">{company.name}</h3>
              </div>
              <div className="rounded-2xl bg-sea-100 p-3">
                <Settings2 className="h-5 w-5 text-sea-700" />
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm text-slate-700">
              <div className="flex justify-between gap-3">
                <span>Company slug</span>
                <span className="font-semibold">{company.slug}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Created</span>
                <span className="font-semibold">{formatDate(company.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Current role</span>
                <StatusBadge value={currentUser.role} />
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sea-700">Integration surface</p>
            <h3 className="mt-2 text-2xl font-bold text-ink">Provider readiness</h3>
            <div className="mt-6 grid gap-3">
              {integrationMeta.map((item) => {
                const Icon = item.icon;
                const enabled = integrations[item.key];

                return (
                  <div key={item.key} className="flex items-center justify-between rounded-3xl border border-slate-200/80 bg-slate-50/70 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <Icon className="h-4 w-4 text-sea-700" />
                      </div>
                      <span className="font-medium text-slate-700">{item.label}</span>
                    </div>
                    <StatusBadge value={enabled ? "ACTIVE" : "ARCHIVED"} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sea-700">Company settings</p>
              <h3 className="mt-2 text-2xl font-bold text-ink">Brand, locale, and operating defaults</h3>
            </div>
            <div
              className="h-12 w-12 rounded-2xl border border-white/80"
              style={{ backgroundColor: form.watch("brandColor") }}
            />
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Company name</span>
              <input
                disabled={!canEdit}
                className="w-full rounded-2xl border-slate-200 bg-white text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
                {...form.register("name")}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Brand color</span>
                <input
                  disabled={!canEdit}
                  className="w-full rounded-2xl border-slate-200 bg-white text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
                  {...form.register("brandColor")}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Locale</span>
                <input
                  disabled={!canEdit}
                  className="w-full rounded-2xl border-slate-200 bg-white text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
                  {...form.register("locale")}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Currency</span>
                <input
                  disabled={!canEdit}
                  className="w-full rounded-2xl border-slate-200 bg-white text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
                  {...form.register("currency")}
                />
              </label>
            </div>

            <div className="grid gap-2 text-xs text-rose-600">
              <p>{form.formState.errors.name?.message}</p>
              <p>{form.formState.errors.brandColor?.message}</p>
              <p>{form.formState.errors.locale?.message}</p>
              <p>{form.formState.errors.currency?.message}</p>
            </div>

            {feedback ? (
              <div className={`rounded-2xl px-4 py-3 text-sm ${feedback === "Settings saved." ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                {feedback}
              </div>
            ) : null}

            {canEdit ? (
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Save settings
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Agents can view settings but only managers and admins can update them.
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
