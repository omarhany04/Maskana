"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Mail } from "lucide-react";

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
    <section className="glass-panel p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sea-700">Secure Access</p>
        <h2 className="mt-2 text-3xl font-bold text-ink">Sign in to your workspace</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          JWT-authenticated access for admins, managers, and agents.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-sea-400">
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
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-sea-400">
            <LockKeyhole className="h-4 w-4 text-slate-400" />
            <input
              type="password"
              className="w-full border-none bg-transparent p-0 text-sm text-slate-700 focus:ring-0"
              {...form.register("password")}
            />
          </div>
          <p className="mt-2 text-xs text-rose-600">{form.formState.errors.password?.message}</p>
        </label>

        {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </section>
  );
}

