"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, ShieldCheck, Trash2, UserCog2 } from "lucide-react";
import { z } from "zod";

import type { ApiListResponse, SessionUser } from "@real-estate-crm/shared";
import { roles, userCreateSchema } from "@real-estate-crm/shared";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TablePagination } from "@/components/ui/TablePagination";
import { formatDate } from "@/lib/utils";

const userFormSchema = userCreateSchema.extend({
  password: z.string().min(8).max(100).or(z.literal("")),
});

type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    assignedLeads: number;
  };
};

type UserFormValues = {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MANAGER" | "AGENT";
  phone?: string | null;
  isActive: boolean;
};

const defaultUserValues: UserFormValues = {
  name: "",
  email: "",
  password: "",
  role: "AGENT",
  phone: "",
  isActive: true,
};

export function UserManagement({
  currentUser,
  initialData,
}: {
  currentUser: SessionUser;
  initialData: ApiListResponse<UserRecord>;
}) {
  const [data, setData] = useState(initialData.data);
  const [meta, setMeta] = useState(initialData.meta);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: defaultUserValues,
  });

  async function loadUsers(page = meta.page) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(meta.limit),
    });
    if (deferredQuery) {
      params.set("q", deferredQuery);
    }
    if (roleFilter) {
      params.set("role", roleFilter);
    }

    const response = await fetch(`/api/users?${params.toString()}`, { cache: "no-store" });
    const payload = await response.json();
    setData(payload.data);
    setMeta(payload.meta);
  }

  useEffect(() => {
    void loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredQuery, roleFilter]);

  function resetEditor() {
    setEditingUserId(null);
    setFeedback(null);
    form.reset(defaultUserValues);
  }

  function editUser(user: UserRecord) {
    setEditingUserId(user.id);
    setFeedback(null);
    form.reset({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role as UserFormValues["role"],
      phone: user.phone ?? "",
      isActive: user.isActive,
    });
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setFeedback(null);
      const payload = editingUserId && !values.password ? { ...values, password: undefined } : values;

      if (!editingUserId && !values.password) {
        setFeedback("Password is required for new users.");
        return;
      }

      const response = await fetch(editingUserId ? `/api/users/${editingUserId}` : "/api/users", {
        method: editingUserId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        setFeedback(error.message ?? "Unable to save user.");
        return;
      }

      resetEditor();
      await loadUsers(editingUserId ? meta.page : 1);
    });
  });

  function removeUser(userId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });

      if (!response.ok) {
        const error = await response.json();
        setFeedback(error.message ?? "Unable to delete user.");
        return;
      }

      if (editingUserId === userId) {
        resetEditor();
      }
      await loadUsers(meta.page);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="User administration"
        title="Team access, roles, and activation"
        description={`Administrative control center for ${currentUser.email}. Create accounts, assign roles, and manage tenant membership.`}
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="glass-panel p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-bold text-ink">Company roster</h3>
                <p className="mt-1 text-sm text-slate-600">Admin-only CRUD for users, roles, and account status.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search users"
                  className="rounded-2xl border-slate-200 bg-white text-sm"
                />
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="rounded-2xl border-slate-200 bg-white text-sm"
                >
                  <option value="">All roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="data-grid">
            <div className="overflow-x-auto">
              <table className="grid-table min-w-full">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Pipeline</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((user) => (
                    <tr key={user.id} className="border-t border-slate-200/70">
                      <td>
                        <p className="font-semibold text-slate-800">{user.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                        <p className="mt-2 text-xs text-slate-500">{user.phone ?? "No phone"}</p>
                      </td>
                      <td>
                        <StatusBadge value={user.role} />
                      </td>
                      <td>
                        <StatusBadge value={user.isActive ? "ACTIVE" : "ARCHIVED"} />
                      </td>
                      <td>{user._count?.assignedLeads ?? 0} active lead(s)</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => editUser(user)}>
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => removeUser(user.id)}
                            disabled={user.id === currentUser.id}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPrevious={() => void loadUsers(meta.page - 1)}
              onNext={() => void loadUsers(meta.page + 1)}
            />
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sea-700">
                {editingUserId ? "Update member" : "Invite member"}
              </p>
              <h3 className="mt-2 text-2xl font-bold text-ink">
                {editingUserId ? "Edit role and access" : "Create a tenant user"}
              </h3>
            </div>
            <div className="rounded-2xl bg-sea-100 p-3">
              <UserCog2 className="h-5 w-5 text-sea-700" />
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
              <input className="w-full rounded-2xl border-slate-200 bg-white text-sm" {...form.register("name")} />
              <p className="mt-2 text-xs text-rose-600">{form.formState.errors.name?.message}</p>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <input type="email" className="w-full rounded-2xl border-slate-200 bg-white text-sm" {...form.register("email")} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Phone</span>
                <input className="w-full rounded-2xl border-slate-200 bg-white text-sm" {...form.register("phone")} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                <input type="password" className="w-full rounded-2xl border-slate-200 bg-white text-sm" {...form.register("password")} />
                <p className="mt-2 text-xs text-slate-500">
                  {editingUserId ? "Leave empty to keep the existing password." : "Minimum 8 characters."}
                </p>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Role</span>
                <select className="w-full rounded-2xl border-slate-200 bg-white text-sm" {...form.register("role")}>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" className="rounded border-slate-300 text-sea-600" {...form.register("isActive")} />
              Account is active and allowed to sign in
            </label>

            {feedback ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{feedback}</div> : null}

            <div className="flex flex-wrap justify-end gap-3">
              {editingUserId ? (
                <Button variant="secondary" type="button" onClick={resetEditor}>
                  Cancel
                </Button>
              ) : null}
              <Button type="submit" disabled={isPending}>
                <Save className="mr-2 h-4 w-4" />
                {editingUserId ? "Save user" : "Create user"}
              </Button>
            </div>
          </form>

          <div className="mt-6 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-sea-700" />
              <p className="text-sm font-semibold text-slate-700">JWT sessions inherit role and company scope.</p>
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Tenant isolation is enforced across middleware, route handlers, and Prisma query filters for every user.
            </p>
          </div>

          {isPending ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Trash2 className="h-4 w-4 animate-pulse" />
              Updating roster...
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
