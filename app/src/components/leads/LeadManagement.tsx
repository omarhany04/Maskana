"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Filter, MessageSquare, PencilLine, Save, Sparkles, Trash2, UserPlus2 } from "lucide-react";

import type { ApiListResponse, SessionUser } from "@real-estate-crm/shared";
import { leadCreateSchema, leadStatuses } from "@real-estate-crm/shared";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TablePagination } from "@/components/ui/TablePagination";
import { normalizePhoneNumber } from "@/lib/phone";
import { formatCurrency, formatDate } from "@/lib/utils";

type LeadRecord = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  budget: number | string | null;
  location: string | null;
  propertyType: string | null;
  intent: string | null;
  notes: string | null;
  aiScore: number | null;
  aiClassification: string | null;
  createdAt: string;
  assignedTo: {
    id: string;
    name: string;
    role: string;
  } | null;
  property: {
    id: string;
    title: string;
    referenceCode: string;
    price: number | string;
  } | null;
  activities: Array<{
    id: string;
    type: string;
    note: string;
    occurredAt: string;
  }>;
};

type LeadFormValues = {
  fullName: string;
  email?: string;
  phone?: string;
  source: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "VISIT" | "CLOSED";
  budget?: number | null;
  location?: string | null;
  propertyType?: string | null;
  intent?: string | null;
  notes?: string | null;
  assignedToId?: string | null;
  propertyId?: string | null;
};

const defaultLeadValues: LeadFormValues = {
  fullName: "",
  email: "",
  phone: "",
  source: "Website",
  status: "NEW",
  budget: null,
  location: "",
  propertyType: "",
  intent: "buy",
  notes: "",
  assignedToId: null,
  propertyId: null,
};

export function LeadManagement({
  initialData,
  agents,
  currentUser,
  properties,
}: {
  initialData: ApiListResponse<LeadRecord>;
  agents: Array<{ id: string; name: string; role: string }>;
  currentUser: SessionUser;
  properties: Array<{ id: string; title: string; referenceCode: string }>;
}) {
  const [data, setData] = useState(initialData.data);
  const [meta, setMeta] = useState(initialData.meta);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("");
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [insightQuery, setInsightQuery] = useState("Investor looking for luxury villa in North Coast under $1.2M");
  const [insightResult, setInsightResult] = useState<string>("");
  const [semanticMatches, setSemanticMatches] = useState<Array<Record<string, unknown>>>([]);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const deferredQuery = useDeferredValue(query);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadCreateSchema),
    defaultValues: defaultLeadValues,
  });
  const phoneField = form.register("phone");
  const watchedPhone = form.watch("phone") ?? "";
  const normalizedPhonePreview = normalizePhoneNumber(watchedPhone);
  const showsAutoPhoneHint = Boolean(
    watchedPhone.trim() && normalizedPhonePreview && normalizedPhonePreview !== watchedPhone.trim(),
  );

  async function loadLeads(page = meta.page) {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(meta.limit),
      });

      if (deferredQuery) {
        params.set("q", deferredQuery);
      }
      if (statusFilter) {
        params.set("status", statusFilter);
      }
      if (assignedToFilter) {
        params.set("assignedToId", assignedToFilter);
      }

      const response = await fetch(`/api/leads?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      setData(payload.data);
      setMeta(payload.meta);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadLeads(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredQuery, statusFilter, assignedToFilter]);

  function resetEditor() {
    setEditingLeadId(null);
    setFormMessage(null);
    form.reset(defaultLeadValues);
  }

  function revealEditor() {
    window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      form.setFocus("fullName");
    });
  }

  function openCreateLead() {
    resetEditor();
    revealEditor();
  }

  function startEditing(lead: LeadRecord) {
    setEditingLeadId(lead.id);
    setFormMessage(null);
    form.reset({
      fullName: lead.fullName,
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      source: lead.source,
      status: lead.status as LeadFormValues["status"],
      budget: lead.budget ? Number(lead.budget) : null,
      location: lead.location ?? "",
      propertyType: lead.propertyType ?? "",
      intent: lead.intent ?? "",
      notes: lead.notes ?? "",
      assignedToId: lead.assignedTo?.id ?? null,
      propertyId: lead.property?.id ?? null,
    });
    revealEditor();
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setFormMessage(null);
      const response = await fetch(editingLeadId ? `/api/leads/${editingLeadId}` : "/api/leads", {
        method: editingLeadId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        setFormMessage(error.message ?? "Unable to save lead.");
        return;
      }

      resetEditor();
      await loadLeads(editingLeadId ? meta.page : 1);
    });
  });

  function changeStatus(leadId: string, status: string) {
    startTransition(async () => {
      await fetch(`/api/leads/${leadId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadLeads(meta.page);
    });
  }

  function assignLeadToAgent(leadId: string, assignedToId: string) {
    startTransition(async () => {
      await fetch(`/api/leads/${leadId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId }),
      });
      await loadLeads(meta.page);
    });
  }

  function removeLead(leadId: string) {
    startTransition(async () => {
      await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      if (editingLeadId === leadId) {
        resetEditor();
      }
      await loadLeads(Math.max(1, meta.page));
    });
  }

  function runInsightActions() {
    startTransition(async () => {
      const [analysisResponse, searchResponse] = await Promise.all([
        fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: insightQuery }),
        }),
        fetch("/api/ai/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: insightQuery, limit: 4 }),
        }),
      ]);

      const analysis = await analysisResponse.json();
      const search = await searchResponse.json();
      setInsightResult(
        `Intent: ${analysis.intent}. Budget: ${analysis.budget ?? "N/A"}. Location: ${analysis.location ?? "N/A"}. Type: ${analysis.propertyType ?? "N/A"}.`,
      );
      setSemanticMatches(search.matches ?? []);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lead operations"
        title="Lead pipeline and assignment desk"
        description="Capture, qualify, assign, and advance leads with tenant-aware visibility, AI scoring, and built-in outreach."
        action={
          <Button onClick={openCreateLead} variant={editingLeadId ? "secondary" : "primary"}>
            <UserPlus2 className="h-4 w-4" />
            {editingLeadId ? "Create new lead" : "New lead"}
          </Button>
        }
      />

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(540px,0.76fr)]">
        <div className="space-y-6">
          <div className="glass-panel p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sea-100 p-3 shadow-sm">
                  <Filter className="h-5 w-5 text-sea-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-ink">Lead directory</h3>
                  <p className="text-sm text-slate-600">Role-aware listing, activity trail, assignment, and status control.</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search leads"
                  className="rounded-lg border-slate-200 bg-white text-sm"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-lg border-slate-200 bg-white text-sm"
                >
                  <option value="">All statuses</option>
                  {leadStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {currentUser.role !== "AGENT" ? (
                  <select
                    value={assignedToFilter}
                    onChange={(event) => setAssignedToFilter(event.target.value)}
                    className="rounded-lg border-slate-200 bg-white text-sm"
                  >
                    <option value="">All agents</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </div>
          </div>

          <div className="data-grid">
            <div className="overflow-x-auto">
              <table className="grid-table min-w-full">
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Status</th>
                    <th>Budget</th>
                    <th>Assigned</th>
                    <th>Property</th>
                    <th>Signals</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((lead) => (
                    <tr key={lead.id} className="border-t border-slate-200/70">
                      <td>
                        <div>
                          <p className="font-semibold text-slate-800">{lead.fullName}</p>
                          <p className="mt-1 text-xs text-slate-500">{lead.email ?? lead.phone ?? "No contact method"}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            {lead.source} • {formatDate(lead.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="space-y-3">
                        <StatusBadge value={lead.status} />
                        <select
                          value={lead.status}
                          onChange={(event) => changeStatus(lead.id, event.target.value)}
                          className="w-full rounded-lg border-slate-200 bg-white text-xs"
                        >
                          {leadStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <p className="font-semibold text-slate-800">{lead.budget ? formatCurrency(lead.budget) : "N/A"}</p>
                        <p className="mt-1 text-xs text-slate-500">{lead.location ?? "No location"}</p>
                      </td>
                      <td className="space-y-3">
                        <p className="font-medium text-slate-700">{lead.assignedTo?.name ?? "Unassigned"}</p>
                        {currentUser.role !== "AGENT" ? (
                          <select
                            value={lead.assignedTo?.id ?? ""}
                            onChange={(event) => event.target.value && assignLeadToAgent(lead.id, event.target.value)}
                            className="w-full rounded-lg border-slate-200 bg-white text-xs"
                          >
                            <option value="">Assign agent</option>
                            {agents.map((agent) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.name}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </td>
                      <td>
                        <p className="font-medium text-slate-700">{lead.property?.title ?? "No property linked"}</p>
                        <p className="mt-1 text-xs text-slate-500">{lead.property?.referenceCode ?? "N/A"}</p>
                      </td>
                      <td>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <StatusBadge value={lead.aiClassification} />
                            <span className="text-xs font-semibold text-slate-500">{lead.aiScore ?? 0}/100</span>
                          </div>
                          <p className="text-xs text-slate-500">{lead.activities[0]?.note ?? "No recent activity"}</p>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/leads/${lead.id}/messages`}
                            className="inline-flex min-h-10 items-center justify-center gap-2 overflow-hidden rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-white shadow-glow transition duration-200 hover:-translate-y-0.5 hover:bg-slate-950 hover:shadow-lift focus:outline-none focus:ring-4 focus:ring-sea-200/60"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Message
                          </Link>
                          <Button variant="secondary" onClick={() => startEditing(lead)}>
                            <PencilLine className="h-4 w-4" />
                            Edit
                          </Button>
                          {currentUser.role !== "AGENT" ? (
                            <Button variant="danger" onClick={() => removeLead(lead.id)}>
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          ) : null}
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
              onPrevious={() => void loadLeads(meta.page - 1)}
              onNext={() => void loadLeads(meta.page + 1)}
            />
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
              <p className="text-xs font-bold uppercase text-sea-700">Lead intelligence</p>
                <h3 className="mt-2 text-xl font-bold text-ink">AI lead routing preview</h3>
              </div>
              <div className="rounded-lg bg-gold-100 p-3 shadow-sm">
                <Bot className="h-5 w-5 text-gold-700" />
              </div>
            </div>
            <textarea
              value={insightQuery}
              onChange={(event) => setInsightQuery(event.target.value)}
              className="mt-5 min-h-28 w-full rounded-lg border-slate-200 bg-white text-sm"
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={runInsightActions} disabled={isPending}>
                <Bot className="h-4 w-4" />
                Run AI routing
              </Button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="metric-tile">
                <p className="text-xs font-bold uppercase text-slate-500">Analysis</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{insightResult || "Intent extraction appears here."}</p>
              </div>
              <div className="metric-tile">
                <p className="text-xs font-bold uppercase text-slate-500">Matched listings</p>
                <div className="mt-3 space-y-3">
                  {semanticMatches.length > 0 ? (
                    semanticMatches.map((match, index) => (
                      <div key={`${String(match.id)}-${index}`} className="rounded-lg bg-white p-3">
                        <p className="font-semibold text-slate-700">{String(match.title ?? "Untitled")}</p>
                        <p className="text-xs text-slate-500">{String(match.location ?? "Unknown location")}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Semantic matches appear after analysis.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div ref={editorRef} className="glass-panel scroll-mt-6 self-start p-6 2xl:sticky 2xl:top-28">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase text-sea-700">
                {editingLeadId ? "Update lead" : "Create lead"}
              </p>
              <h3 className="mt-2 text-2xl font-bold text-ink">
                {editingLeadId ? "Edit qualification profile and outreach" : "Capture a new opportunity"}
              </h3>
            </div>
            <div className="rounded-lg bg-sea-100 p-3 shadow-sm">
              <UserPlus2 className="h-5 w-5 text-sea-700" />
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
                <input className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("fullName")} />
                <p className="mt-2 text-xs text-rose-600">{form.formState.errors.fullName?.message}</p>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Source</span>
                <input className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("source")} />
                <p className="mt-2 text-xs text-rose-600">{form.formState.errors.source?.message}</p>
              </label>
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <input type="email" className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("email")} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Phone</span>
                <input
                  type="tel"
                  placeholder="010..., 201..., or +201..."
                  className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm"
                  {...phoneField}
                  onBlur={(event) => {
                    phoneField.onBlur(event);
                    const normalized = normalizePhoneNumber(event.target.value);

                    if (normalized && normalized !== event.target.value.trim()) {
                      form.setValue("phone", normalized, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                />
                <p className={`mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 ${showsAutoPhoneHint ? "text-emerald-700" : "text-slate-500"}`}>
                  {showsAutoPhoneHint
                    ? `Will be saved as ${normalizedPhonePreview} for WhatsApp compatibility.`
                    : "Local mobile numbers are converted to international format automatically when possible."}
                </p>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Budget</span>
                <input type="number" className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("budget")} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
                <select className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("status")}>
                  {leadStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Location</span>
                <input className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("location")} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Property type</span>
                <input className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("propertyType")} />
              </label>
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Intent</span>
                <select className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("intent")}>
                  {["buy", "rent", "sell", "invest"].map((intent) => (
                    <option key={intent} value={intent}>
                      {intent}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Property</span>
                <select className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("propertyId")}>
                  <option value="">No linked property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.title} ({property.referenceCode})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {currentUser.role !== "AGENT" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Assigned agent</span>
                <select className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("assignedToId")}>
                  <option value="">Unassigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Notes</span>
              <textarea className="min-h-32 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("notes")} />
            </label>

            {formMessage ? <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formMessage}</div> : null}

            <div className="flex flex-wrap justify-end gap-3">
              {editingLeadId ? (
                <Button variant="secondary" type="button" onClick={resetEditor}>
                  Cancel
                </Button>
              ) : null}
              <Button type="submit" disabled={isPending}>
                <Save className="h-4 w-4" />
                {editingLeadId ? "Save changes" : "Create lead"}
              </Button>
            </div>
          </form>

          <div className="mt-6 metric-tile">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-sea-700" />
              <p className="text-sm font-semibold text-slate-700">Lead scoring is refreshed on create and update.</p>
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              AI classification is stored on the lead record and displayed in the pipeline grid for prioritization.
            </p>
          </div>

          {(isLoading || isPending) && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Trash2 className="h-4 w-4 animate-pulse" />
              Syncing lead data...
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
