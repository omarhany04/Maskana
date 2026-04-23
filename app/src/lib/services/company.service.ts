import type { SessionUser } from "@real-estate-crm/shared";

import { ApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

type CompanySettingsInput = {
  name?: string;
  brandColor?: string;
  locale?: string;
  currency?: string;
};

export async function getCompanyProfile(ctx: SessionUser) {
  const company = await prisma.company.findUnique({
    where: {
      id: ctx.companyId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      settings: true,
    },
  });

  if (!company) {
    throw new ApiError(404, "Company not found.");
  }

  return company;
}

export async function updateCompanyProfile(ctx: SessionUser, input: CompanySettingsInput) {
  if (ctx.role === "AGENT") {
    throw new ApiError(403, "Only managers and admins can update company settings.");
  }

  const company = await prisma.company.findUnique({
    where: {
      id: ctx.companyId,
    },
  });

  if (!company) {
    throw new ApiError(404, "Company not found.");
  }

  const currentSettings =
    company.settings && typeof company.settings === "object" && !Array.isArray(company.settings)
      ? (company.settings as Record<string, unknown>)
      : {};

  return prisma.company.update({
    where: {
      id: company.id,
    },
    data: {
      name: input.name ?? company.name,
      settings: {
        ...currentSettings,
        ...(input.brandColor ? { brandColor: input.brandColor } : {}),
        ...(input.locale ? { locale: input.locale } : {}),
        ...(input.currency ? { currency: input.currency } : {}),
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      settings: true,
    },
  });
}
