import { Prisma } from "@prisma/client";
import type { SessionUser } from "@real-estate-crm/shared";

import { aiClient } from "@/lib/ai/client";
import { ApiError } from "@/lib/api-response";
import { buildPaginationMeta, getPagination } from "@/lib/pagination";
import { isManagerOrAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createReferenceCode, slugify } from "@/lib/utils";

type PropertyListQuery = {
  page: number;
  limit: number;
  q?: string;
  status?: "DRAFT" | "ACTIVE" | "UNDER_OFFER" | "SOLD" | "ARCHIVED";
};

type PropertyInput = {
  title?: string;
  description?: string;
  propertyType?: string;
  location?: string;
  address?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm?: number;
  status?: "DRAFT" | "ACTIVE" | "UNDER_OFFER" | "SOLD" | "ARCHIVED";
  imageUrls?: string[];
  listedById?: string | null;
};

async function ensurePropertyAccessible(ctx: SessionUser, propertyId: string) {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      companyId: ctx.companyId,
    },
    include: {
      listedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  if (!property) {
    throw new ApiError(404, "Property not found.");
  }

  return property;
}

async function syncCompanyProperties(companyId: string) {
  const properties = await prisma.property.findMany({
    where: {
      companyId,
      status: {
        not: "ARCHIVED",
      },
    },
    select: {
      id: true,
      companyId: true,
      title: true,
      description: true,
      location: true,
      address: true,
      propertyType: true,
      price: true,
      bedrooms: true,
      bathrooms: true,
      areaSqm: true,
      referenceCode: true,
      imageUrls: true,
    },
  });

  await aiClient.indexProperties(
    companyId,
    properties.map((property) => ({
      ...property,
      price: Number(property.price),
    })),
  );
}

export async function listProperties(ctx: SessionUser, query: PropertyListQuery) {
  const { page, limit, skip, take } = getPagination(query.page, query.limit);
  const where: Prisma.PropertyWhereInput = {
    companyId: ctx.companyId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" } },
            { location: { contains: query.q, mode: "insensitive" } },
            { propertyType: { contains: query.q, mode: "insensitive" } },
            { referenceCode: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        listedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        _count: {
          select: {
            leads: true,
          },
        },
      },
    }),
    prisma.property.count({ where }),
  ]);

  return {
    data,
    meta: buildPaginationMeta(page, limit, total),
  };
}

export async function getPropertyById(ctx: SessionUser, propertyId: string) {
  return ensurePropertyAccessible(ctx, propertyId);
}

export async function createProperty(ctx: SessionUser, input: PropertyInput) {
  const listedById = input.listedById || ctx.id;

  const listedBy = await prisma.user.findFirst({
    where: {
      id: listedById,
      companyId: ctx.companyId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!listedBy) {
    throw new ApiError(404, "Listing agent not found.");
  }

  const referencePrefix = `${slugify(input.propertyType ?? "PROP").slice(0, 3).toUpperCase()}${new Date().getFullYear()}`;

  const property = await prisma.property.create({
    data: {
      companyId: ctx.companyId,
      listedById,
      title: input.title ?? "",
      description: input.description ?? "",
      propertyType: input.propertyType ?? "",
      location: input.location ?? "",
      address: input.address ?? "",
      price: input.price ?? 0,
      bedrooms: input.bedrooms ?? 0,
      bathrooms: input.bathrooms ?? 0,
      areaSqm: input.areaSqm ?? 0,
      status: input.status ?? "ACTIVE",
      imageUrls: input.imageUrls ?? [],
      referenceCode: createReferenceCode(referencePrefix),
    },
    include: {
      listedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  await syncCompanyProperties(ctx.companyId).catch((error) => console.warn("Property indexing skipped", error));

  return property;
}

export async function updateProperty(ctx: SessionUser, propertyId: string, input: PropertyInput) {
  const current = await ensurePropertyAccessible(ctx, propertyId);

  if (input.listedById) {
    const listedBy = await prisma.user.findFirst({
      where: {
        id: input.listedById,
        companyId: ctx.companyId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!listedBy) {
      throw new ApiError(404, "Listing agent not found.");
    }
  }

  const property = await prisma.property.update({
    where: {
      id: current.id,
    },
    data: {
      title: input.title ?? current.title,
      description: input.description ?? current.description,
      propertyType: input.propertyType ?? current.propertyType,
      location: input.location ?? current.location,
      address: input.address ?? current.address,
      price: input.price ?? current.price,
      bedrooms: input.bedrooms ?? current.bedrooms,
      bathrooms: input.bathrooms ?? current.bathrooms,
      areaSqm: input.areaSqm ?? current.areaSqm,
      status: input.status ?? current.status,
      imageUrls: input.imageUrls ?? current.imageUrls,
      listedById: input.listedById ?? current.listedById,
    },
    include: {
      listedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  await syncCompanyProperties(ctx.companyId).catch((error) => console.warn("Property indexing skipped", error));

  return property;
}

export async function deleteProperty(ctx: SessionUser, propertyId: string) {
  if (!isManagerOrAdmin(ctx.role)) {
    throw new ApiError(403, "Only managers and admins can delete properties.");
  }

  const property = await ensurePropertyAccessible(ctx, propertyId);

  await prisma.property.delete({
    where: {
      id: property.id,
    },
  });

  await syncCompanyProperties(ctx.companyId).catch((error) => console.warn("Property indexing skipped", error));

  return { success: true };
}

