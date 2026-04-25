"use client";

import Image from "next/image";
import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, PencilLine, Save, SearchCode, Trash2 } from "lucide-react";

import type { ApiListResponse, SessionUser } from "@real-estate-crm/shared";
import { propertyCreateSchema, propertyStatuses } from "@real-estate-crm/shared";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TablePagination } from "@/components/ui/TablePagination";
import { formatCurrency } from "@/lib/utils";

type PropertyRecord = {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  location: string;
  address: string;
  price: number | string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  status: string;
  referenceCode: string;
  imageUrls: string[];
  listedBy: {
    id: string;
    name: string;
    role: string;
  } | null;
  _count: {
    leads: number;
  };
};

type PropertyFormValues = {
  title: string;
  description: string;
  propertyType: string;
  location: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  status: "DRAFT" | "ACTIVE" | "UNDER_OFFER" | "SOLD" | "ARCHIVED";
  imageUrls: string[];
  listedById?: string | null;
};

const defaultPropertyValues: PropertyFormValues = {
  title: "",
  description: "",
  propertyType: "Apartment",
  location: "",
  address: "",
  price: 0,
  bedrooms: 1,
  bathrooms: 1,
  areaSqm: 0,
  status: "ACTIVE",
  imageUrls: [],
  listedById: null,
};

export function PropertyManagement({
  initialData,
  agents,
  currentUser,
}: {
  initialData: ApiListResponse<PropertyRecord>;
  agents: Array<{ id: string; name: string; role: string }>;
  currentUser: SessionUser;
}) {
  const [data, setData] = useState(initialData.data);
  const [meta, setMeta] = useState(initialData.meta);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [semanticQuery, setSemanticQuery] = useState("Waterfront villa with private pool and strong family layout");
  const [semanticMatches, setSemanticMatches] = useState<Array<Record<string, unknown>>>([]);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const editorRef = useRef<HTMLDivElement>(null);
  const deferredQuery = useDeferredValue(query);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyCreateSchema),
    defaultValues: defaultPropertyValues,
  });

  async function loadProperties(page = meta.page) {
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

    const response = await fetch(`/api/properties?${params.toString()}`, { cache: "no-store" });
    const payload = await response.json();
    setData(payload.data);
    setMeta(payload.meta);
  }

  useEffect(() => {
    void loadProperties(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredQuery, statusFilter]);

  function resetEditor() {
    setEditingPropertyId(null);
    setFeedback(null);
    form.reset(defaultPropertyValues);
  }

  function revealEditor() {
    window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      form.setFocus("title");
    });
  }

  function openCreateProperty() {
    resetEditor();
    revealEditor();
  }

  function editProperty(property: PropertyRecord) {
    setEditingPropertyId(property.id);
    setFeedback(null);
    form.reset({
      title: property.title,
      description: property.description,
      propertyType: property.propertyType,
      location: property.location,
      address: property.address,
      price: Number(property.price),
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqm: property.areaSqm,
      status: property.status as PropertyFormValues["status"],
      imageUrls: property.imageUrls ?? [],
      listedById: property.listedBy?.id ?? null,
    });
    revealEditor();
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setFeedback(null);
      const response = await fetch(editingPropertyId ? `/api/properties/${editingPropertyId}` : "/api/properties", {
        method: editingPropertyId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        setFeedback(error.message ?? "Unable to save property.");
        return;
      }

      resetEditor();
      await loadProperties(editingPropertyId ? meta.page : 1);
    });
  });

  function deleteProperty(propertyId: string) {
    startTransition(async () => {
      await fetch(`/api/properties/${propertyId}`, { method: "DELETE" });
      if (editingPropertyId === propertyId) {
        resetEditor();
      }
      await loadProperties(meta.page);
    });
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setFeedback(null);

    try {
      const signedResponse = await fetch("/api/properties/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!signedResponse.ok) {
        const error = await signedResponse.json();
        setFeedback(error.message ?? "Upload preparation failed.");
        return;
      }

      const signedPayload = await signedResponse.json();

      const uploadResponse = await fetch(signedPayload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        setFeedback("S3 upload failed.");
        return;
      }

      form.setValue("imageUrls", [...(form.getValues("imageUrls") ?? []), signedPayload.publicUrl], {
        shouldDirty: true,
        shouldValidate: true,
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function removeImage(url: string) {
    form.setValue(
      "imageUrls",
      (form.getValues("imageUrls") ?? []).filter((value) => value !== url),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function runSemanticSearch() {
    startTransition(async () => {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: semanticQuery, limit: 5 }),
      });
      const payload = await response.json();
      setSemanticMatches(payload.matches ?? []);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Property inventory"
        title="Listing operations and media workflow"
        description="Manage catalog, upload S3-hosted property media, and preview AI semantic search against the vector index."
        action={
          <Button onClick={openCreateProperty} variant={editingPropertyId ? "secondary" : "primary"}>
            <Camera className="h-4 w-4" />
            {editingPropertyId ? "Create listing" : "New listing"}
          </Button>
        }
      />

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(540px,0.78fr)]">
        <div className="space-y-6">
          <div className="glass-panel p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sea-100 p-3 shadow-sm">
                  <SearchCode className="h-5 w-5 text-sea-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-ink">Listing directory</h3>
                  <p className="mt-1 text-sm text-slate-600">Tenant-filtered listings with assignment, pricing, and lead demand context.</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search listings"
                  className="rounded-lg border-slate-200 bg-white text-sm"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-lg border-slate-200 bg-white text-sm"
                >
                  <option value="">All statuses</option>
                  {propertyStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
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
                    <th>Listing</th>
                    <th>Status</th>
                    <th>Price</th>
                    <th>Specs</th>
                    <th>Agent</th>
                    <th>Demand</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((property) => (
                    <tr key={property.id} className="border-t border-slate-200/70">
                      <td>
                        <div className="flex gap-3">
                          <div className="image-frame h-16 w-16 shrink-0">
                            {property.imageUrls[0] ? (
                              <Image src={property.imageUrls[0]} alt={property.title} fill className="object-cover" unoptimized />
                            ) : null}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{property.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{property.referenceCode}</p>
                            <p className="mt-2 text-xs text-slate-500">{property.location}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <StatusBadge value={property.status} />
                      </td>
                      <td>
                        <p className="font-semibold text-slate-800">{formatCurrency(property.price)}</p>
                        <p className="mt-1 text-xs text-slate-500">{property.propertyType}</p>
                      </td>
                      <td>
                        <p>{property.bedrooms} bd / {property.bathrooms} ba</p>
                        <p className="mt-1 text-xs text-slate-500">{property.areaSqm} sqm</p>
                      </td>
                      <td>{property.listedBy?.name ?? "Unassigned"}</td>
                      <td>{property._count.leads} lead(s)</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => editProperty(property)}>
                            <PencilLine className="h-4 w-4" />
                            Edit
                          </Button>
                          {currentUser.role !== "AGENT" ? (
                            <Button variant="danger" onClick={() => deleteProperty(property.id)}>
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
              onPrevious={() => void loadProperties(meta.page - 1)}
              onNext={() => void loadProperties(meta.page + 1)}
            />
          </div>

          <div className="glass-panel p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-sea-700">AI listing search</p>
                <h3 className="mt-2 text-xl font-bold text-ink">Semantic property match preview</h3>
              </div>
              <div className="rounded-lg bg-sea-100 p-3 shadow-sm">
                <SearchCode className="h-5 w-5 text-sea-700" />
              </div>
            </div>
            <textarea
              value={semanticQuery}
              onChange={(event) => setSemanticQuery(event.target.value)}
              className="mt-5 min-h-24 w-full rounded-lg border-slate-200 bg-white text-sm"
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={runSemanticSearch} disabled={isPending}>
                <SearchCode className="h-4 w-4" />
                Run search
              </Button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {semanticMatches.length > 0 ? (
                semanticMatches.map((match, index) => (
                  <div key={`${String(match.id)}-${index}`} className="metric-tile">
                    <p className="font-semibold text-slate-700">{String(match.title ?? "Untitled")}</p>
                    <p className="mt-1 text-xs text-slate-500">{String(match.location ?? "Unknown location")}</p>
                    <p className="mt-2 text-sm text-slate-600">{String(match.description ?? "").slice(0, 110)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">FAISS-backed semantic matches appear here.</p>
              )}
            </div>
          </div>
        </div>

        <div ref={editorRef} className="glass-panel scroll-mt-6 self-start p-6 2xl:sticky 2xl:top-28">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase text-sea-700">
                {editingPropertyId ? "Update listing" : "Create listing"}
              </p>
              <h3 className="mt-2 text-2xl font-bold text-ink">
                {editingPropertyId ? "Edit listing details" : "Launch a new listing"}
              </h3>
            </div>
            <div className="rounded-lg bg-gold-100 p-3 shadow-sm">
              <Camera className="h-5 w-5 text-gold-700" />
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Title</span>
                <input className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("title")} />
                <p className="mt-2 text-xs text-rose-600">{form.formState.errors.title?.message}</p>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Property type</span>
                <input className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("propertyType")} />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
              <textarea className="min-h-36 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("description")} />
            </label>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Location</span>
                <input className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("location")} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Address</span>
                <input className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("address")} />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Price</span>
                <input type="number" className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("price")} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
                <select className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("status")}>
                  {propertyStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Bedrooms</span>
                <input type="number" className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("bedrooms")} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Bathrooms</span>
                <input type="number" className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("bathrooms")} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Area (sqm)</span>
                <input type="number" className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("areaSqm")} />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Listing owner</span>
              <select className="min-h-12 w-full rounded-lg border-slate-200 bg-white text-sm" {...form.register("listedById")}>
                <option value="">Assign current user</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/80 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Property media</p>
                  <p className="mt-1 text-sm text-slate-500">Upload listing images directly to S3 using signed URLs.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-sea-600 px-4 py-2.5 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-sea-700">
                  <Camera className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload image"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {form.watch("imageUrls")?.map((url) => (
                  <div key={url} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
                    <div className="image-frame h-16 w-16 shrink-0">
                      <Image src={url} alt="Uploaded property" fill className="object-cover" unoptimized />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-600">{url}</p>
                    </div>
                    <Button type="button" variant="ghost" onClick={() => removeImage(url)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {feedback ? <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{feedback}</div> : null}

            <div className="flex flex-wrap justify-end gap-3">
              {editingPropertyId ? (
                <Button variant="secondary" type="button" onClick={resetEditor}>
                  Cancel
                </Button>
              ) : null}
              <Button type="submit" disabled={isPending || uploading}>
                <Save className="h-4 w-4" />
                {editingPropertyId ? "Save property" : "Create property"}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
