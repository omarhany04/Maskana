"use client";

import Image from "next/image";
import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bath,
  BedDouble,
  Camera,
  MapPin,
  PencilLine,
  Ruler,
  Save,
  SearchCode,
  Trash2,
  UserRound,
  Users2,
  X,
} from "lucide-react";

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

function PropertyVisualCard({
  property,
  onOpen,
}: {
  property: PropertyRecord;
  onOpen: () => void;
}) {
  const imageUrl = property.imageUrls[0];
  const pricePerSqm = property.areaSqm > 0 ? Math.round(Number(property.price) / property.areaSqm) : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative min-h-[300px] overflow-hidden rounded-lg border border-white/80 bg-slate-100 text-left shadow-crisp transition duration-300 hover:-translate-y-1 hover:shadow-lift focus:outline-none focus:ring-4 focus:ring-sea-200/60"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={property.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-sea-50 to-gold-50" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/88 via-ink/20 to-transparent" />
      <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
        <StatusBadge value={property.status} />
        <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-ink shadow-sm">
          {property._count.leads} {property._count.leads === 1 ? "Lead" : "Leads"}
        </span>
      </div>
      <div className="absolute inset-x-4 bottom-4 text-white">
        <p className="text-xl font-bold drop-shadow-sm">{property.title}</p>
        <div className="mt-1 flex items-center gap-1 text-xs text-white/82">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">{property.address || property.location}</span>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold leading-none">
              {pricePerSqm ? `${formatCurrency(pricePerSqm)}` : formatCurrency(property.price)}
              <span className="text-sm font-semibold text-white/75">{pricePerSqm ? "/sqm" : ""}</span>
            </p>
            <p className="mt-1 text-xs font-semibold uppercase text-white/70">{formatCurrency(property.price)} total</p>
          </div>
          <div className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-ink shadow-sm">{property.propertyType}</div>
        </div>
      </div>
    </button>
  );
}

function PropertyDetailsPanel({
  property,
  currentUser,
  onClose,
  onEdit,
  onDelete,
}: {
  property: PropertyRecord;
  currentUser: SessionUser;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const imageUrl = property.imageUrls[0];
  const pricePerSqm = property.areaSqm > 0 ? Math.round(Number(property.price) / property.areaSqm) : null;

  return (
    <aside className="glass-panel p-0">
      <div className="relative min-h-[260px] overflow-hidden rounded-t-lg bg-slate-100">
        {imageUrl ? (
          <Image src={imageUrl} alt={property.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-sea-50 to-gold-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-ink shadow-crisp transition hover:-translate-y-0.5 hover:bg-white"
          aria-label="Close property details"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={property.status} />
            <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-ink">{property.referenceCode}</span>
          </div>
          <h3 className="mt-3 text-3xl font-bold leading-tight">{property.title}</h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-white/82">
            <MapPin className="h-4 w-4" />
            {property.address || property.location}
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="metric-tile">
            <p className="text-xs font-bold uppercase text-slate-500">Total price</p>
            <p className="mt-2 text-2xl font-bold text-ink">{formatCurrency(property.price)}</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs font-bold uppercase text-slate-500">Per sqm</p>
            <p className="mt-2 text-2xl font-bold text-ink">{pricePerSqm ? formatCurrency(pricePerSqm) : "N/A"}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Beds", value: property.bedrooms, icon: BedDouble },
            { label: "Baths", value: property.bathrooms, icon: Bath },
            { label: "Sqm", value: property.areaSqm, icon: Ruler },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="rounded-lg border border-slate-200/80 bg-white/85 p-3 text-center shadow-sm">
                <Icon className="mx-auto h-4 w-4 text-sea-700" />
                <p className="mt-2 text-lg font-bold text-ink">{item.value}</p>
                <p className="text-xs font-bold uppercase text-slate-500">{item.label}</p>
              </div>
            );
          })}
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-sea-700">Overview</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">{property.description}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="metric-tile flex items-center gap-3">
            <div className="rounded-lg bg-sea-100 p-3">
              <UserRound className="h-4 w-4 text-sea-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-slate-500">Listed by</p>
              <p className="truncate text-sm font-semibold text-ink">{property.listedBy?.name ?? "Unassigned"}</p>
            </div>
          </div>
          <div className="metric-tile flex items-center gap-3">
            <div className="rounded-lg bg-gold-100 p-3">
              <Users2 className="h-4 w-4 text-gold-700" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Demand</p>
              <p className="text-sm font-semibold text-ink">{property._count.leads} active lead(s)</p>
            </div>
          </div>
        </div>

        {property.imageUrls.length > 1 ? (
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Gallery</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {property.imageUrls.slice(1, 4).map((url) => (
                <div key={url} className="image-frame aspect-square">
                  <Image src={url} alt={`${property.title} gallery`} fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200/80 pt-5">
          <Button variant="secondary" onClick={onEdit}>
            <PencilLine className="h-4 w-4" />
            Edit listing
          </Button>
          {currentUser.role !== "AGENT" ? (
            <Button variant="danger" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

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
  const [selectedProperty, setSelectedProperty] = useState<PropertyRecord | null>(null);
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
    const nextData = payload.data as PropertyRecord[];
    setData(nextData);
    setMeta(payload.meta);
    setSelectedProperty((current) => {
      if (!current) {
        return null;
      }

      return nextData.find((property) => property.id === current.id) ?? null;
    });
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
      setSelectedProperty((current) => (current?.id === propertyId ? null : current));
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

          <div className="glass-panel p-4 sm:p-5">
            {data.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.map((property) => (
                  <PropertyVisualCard key={property.id} property={property} onOpen={() => setSelectedProperty(property)} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
                <p className="text-sm font-semibold text-slate-700">No listings found</p>
                <p className="mt-2 text-sm text-slate-500">Try a different search term or status filter.</p>
              </div>
            )}
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

      {selectedProperty ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-ink/55 px-3 py-4 backdrop-blur-sm sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-label="Property details"
          onClick={() => setSelectedProperty(null)}
        >
          <div className="ml-auto w-full max-w-2xl" onClick={(event) => event.stopPropagation()}>
            <PropertyDetailsPanel
              property={selectedProperty}
              currentUser={currentUser}
              onClose={() => setSelectedProperty(null)}
              onEdit={() => {
                const property = selectedProperty;
                setSelectedProperty(null);
                editProperty(property);
              }}
              onDelete={() => deleteProperty(selectedProperty.id)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
