"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { loginSchema } from "@real-estate-crm/shared";

import { Button } from "@/components/ui/Button";

type LoginValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@horizonrealty.com",
      password: "Password123!",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setError(null);
      const response = await signIn("credentials", {
        ...values,
        callbackUrl,
        redirect: false,
      });

      if (response?.error) {
        setError("Invalid email or password.");
        return;
      }

      window.location.href = response?.url ?? callbackUrl;
    });
  });

  return (
    <section className="glass-panel fade-up p-7 text-ink lg:p-8">
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ink text-white shadow-glow">
          <Building2 className="h-5 w-5" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase text-sea-700">Secure access</p>
        <h2 className="mt-2 text-3xl font-bold text-ink">Enter the deal room</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">Tenant-scoped access for brokerage operations.</p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
          <div className="control-shell flex items-center gap-3 px-4 py-3">
            <Mail className="h-4 w-4 text-slate-400" />
            <input
              type="email"
              className="w-full border-none bg-transparent p-0 text-sm text-slate-700 focus:ring-0"
              {...form.register("email")}
            />
          </div>
          <p className="mt-2 text-xs text-rose-600">{form.formState.errors.email?.message}</p>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
          <div className="control-shell flex items-center gap-3 px-4 py-3">
            <LockKeyhole className="h-4 w-4 text-slate-400" />
            <input
              type="password"
              className="w-full border-none bg-transparent p-0 text-sm text-slate-700 focus:ring-0"
              {...form.register("password")}
            />
          </div>
          <p className="mt-2 text-xs text-rose-600">{form.formState.errors.password?.message}</p>
        </label>

        {error ? <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          <ShieldCheck className="h-4 w-4" />
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
        <ShieldCheck className="h-4 w-4 text-sea-700" />
        Sessions inherit company and role scope.
      </div>
    </section>
  );
}
