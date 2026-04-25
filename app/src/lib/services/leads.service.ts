import { LeadStatus, Prisma } from "@prisma/client";
import type { SessionUser } from "@real-estate-crm/shared";

import { aiClient } from "@/lib/ai/client";
import { ApiError } from "@/lib/api-response";
import { calendarService } from "@/lib/integrations/calendar";
import { normalizePhoneNumber } from "@/lib/phone";
import { buildPaginationMeta, getPagination } from "@/lib/pagination";
import { isAgent, isManagerOrAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type LeadListQuery = {
  page: number;
  limit: number;
  q?: string;
  status?: LeadStatus;
  assignedToId?: string;
};

type LeadInput = {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  source?: string;
  status?: LeadStatus;
  budget?: number | null;
  location?: string | null;
  propertyType?: string | null;
  intent?: string | null;
  notes?: string | null;
  assignedToId?: string | null;
  propertyId?: string | null;
};

async function ensureUserInCompany(companyId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId,
      isActive: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "Assigned user not found for this company.");
  }

  return user;
}

async function ensurePropertyInCompany(companyId: string, propertyId: string) {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      companyId,
    },
  });

  if (!property) {
    throw new ApiError(404, "Property not found for this company.");
  }

  return property;
}

async function ensureLeadAccessible(ctx: SessionUser, leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      companyId: ctx.companyId,
      ...(isAgent(ctx.role) ? { assignedToId: ctx.id } : {}),
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
          referenceCode: true,
          price: true,
        },
      },
      activities: {
        select: {
          id: true,
          type: true,
          note: true,
          occurredAt: true,
        },
        orderBy: {
          occurredAt: "desc",
        },
        take: 10,
      },
    },
  });

  if (!lead) {
    throw new ApiError(404, "Lead not found.");
  }

  return lead;
}

async function scoreLead(input: Required<Pick<LeadInput, "fullName" | "source">> & LeadInput) {
  try {
    return await aiClient.leadScore({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      source: input.source,
      budget: input.budget,
      location: input.location,
      propertyType: input.propertyType,
      intent: input.intent,
      notes: input.notes,
      status: input.status ?? "NEW",
    });
  } catch (error) {
    console.warn("Lead scoring unavailable", error);
    return null;
  }
}

export async function listLeads(ctx: SessionUser, query: LeadListQuery) {
  const { page, limit, skip, take } = getPagination(query.page, query.limit);
  const where: Prisma.LeadWhereInput = {
    companyId: ctx.companyId,
    ...(isAgent(ctx.role) ? { assignedToId: ctx.id } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.assignedToId && isManagerOrAdmin(ctx.role) ? { assignedToId: query.assignedToId } : {}),
    ...(query.q
      ? {
          OR: [
            { fullName: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
            { phone: { contains: query.q, mode: "insensitive" } },
            { source: { contains: query.q, mode: "insensitive" } },
            { location: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            referenceCode: true,
            price: true,
          },
        },
        activities: {
          select: {
            id: true,
            type: true,
            note: true,
            occurredAt: true,
          },
          orderBy: {
            occurredAt: "desc",
          },
          take: 3,
        },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    data,
    meta: buildPaginationMeta(page, limit, total),
  };
}

export async function getLeadById(ctx: SessionUser, leadId: string) {
  return ensureLeadAccessible(ctx, leadId);
}

export async function createLead(ctx: SessionUser, input: LeadInput) {
  const normalizedPhone = normalizePhoneNumber(input.phone);
  const assignedToId = input.assignedToId
    ? isAgent(ctx.role)
      ? ctx.id
      : input.assignedToId
    : isAgent(ctx.role)
      ? ctx.id
      : null;

  if (assignedToId) {
    await ensureUserInCompany(ctx.companyId, assignedToId);
  }

  if (input.propertyId) {
    await ensurePropertyInCompany(ctx.companyId, input.propertyId);
  }

  const score = input.fullName && input.source ? await scoreLead(input as Required<Pick<LeadInput, "fullName" | "source">> & LeadInput) : null;

  const lead = await prisma.lead.create({
    data: {
      companyId: ctx.companyId,
      assignedToId,
      propertyId: input.propertyId ?? null,
      fullName: input.fullName ?? "",
      email: input.email || null,
      phone: normalizedPhone || null,
      source: input.source ?? "Manual",
      status: input.status ?? "NEW",
      budget: input.budget ?? null,
      location: input.location || null,
      propertyType: input.propertyType || null,
      intent: input.intent || null,
      notes: input.notes || null,
      aiScore: score?.score,
      aiClassification: score?.classification,
      activities: {
        create: {
          companyId: ctx.companyId,
          userId: ctx.id,
          type: "NOTE",
          note: "Lead created.",
        },
      },
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
          referenceCode: true,
          price: true,
        },
      },
    },
  });

  return lead;
}

export async function updateLead(ctx: SessionUser, leadId: string, input: LeadInput) {
  const current = await ensureLeadAccessible(ctx, leadId);
  const normalizedInputPhone = input.phone === undefined ? undefined : normalizePhoneNumber(input.phone);

  if (input.assignedToId && !isManagerOrAdmin(ctx.role)) {
    throw new ApiError(403, "Only managers and admins can reassign leads.");
  }

  if (input.assignedToId) {
    await ensureUserInCompany(ctx.companyId, input.assignedToId);
  }

  if (input.propertyId) {
    await ensurePropertyInCompany(ctx.companyId, input.propertyId);
  }

  const merged = {
    fullName: input.fullName ?? current.fullName,
    email: input.email ?? current.email,
    phone: normalizedInputPhone ?? current.phone,
    source: input.source ?? current.source,
    status: input.status ?? current.status,
    budget: input.budget ?? (current.budget ? Number(current.budget) : null),
    location: input.location ?? current.location,
    propertyType: input.propertyType ?? current.propertyType,
    intent: input.intent ?? current.intent,
    notes: input.notes ?? current.notes,
  };

  const score = await scoreLead({
    ...merged,
    fullName: merged.fullName,
    source: merged.source,
  });

  const lead = await prisma.lead.update({
    where: {
      id: current.id,
    },
    data: {
      fullName: merged.fullName,
      email: merged.email || null,
      phone: merged.phone || null,
      source: merged.source,
      status: merged.status,
      budget: merged.budget,
      location: merged.location || null,
      propertyType: merged.propertyType || null,
      intent: merged.intent || null,
      notes: merged.notes || null,
      propertyId: input.propertyId === undefined ? current.propertyId : input.propertyId,
      assignedToId: input.assignedToId === undefined ? current.assignedToId : input.assignedToId,
      aiScore: score?.score ?? current.aiScore,
      aiClassification: score?.classification ?? current.aiClassification,
      activities: {
        create: {
          companyId: ctx.companyId,
          userId: ctx.id,
          type: "NOTE",
          note: "Lead updated.",
        },
      },
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
          referenceCode: true,
          price: true,
        },
      },
      activities: {
        orderBy: {
          occurredAt: "desc",
        },
        take: 5,
      },
    },
  });

  return lead;
}

export async function deleteLead(ctx: SessionUser, leadId: string) {
  const current = await ensureLeadAccessible(ctx, leadId);

  if (!isManagerOrAdmin(ctx.role)) {
    throw new ApiError(403, "Only managers and admins can delete leads.");
  }

  await prisma.lead.delete({
    where: {
      id: current.id,
    },
  });

  return { success: true };
}

export async function assignLead(ctx: SessionUser, leadId: string, assignedToId: string) {
  if (!isManagerOrAdmin(ctx.role)) {
    throw new ApiError(403, "Only managers and admins can assign leads.");
  }

  const [lead, agent] = await Promise.all([
    ensureLeadAccessible(ctx, leadId),
    ensureUserInCompany(ctx.companyId, assignedToId),
  ]);

  return prisma.lead.update({
    where: {
      id: lead.id,
    },
    data: {
      assignedToId: agent.id,
      activities: {
        create: {
          companyId: ctx.companyId,
          userId: ctx.id,
          type: "ASSIGNMENT",
          note: `Lead assigned to ${agent.name}.`,
        },
      },
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });
}

export async function updateLeadStatus(ctx: SessionUser, leadId: string, status: LeadStatus) {
  const lead = await ensureLeadAccessible(ctx, leadId);

  const updatedLead = await prisma.lead.update({
    where: {
      id: lead.id,
    },
    data: {
      status,
      lastContactedAt: status === "CONTACTED" ? new Date() : lead.lastContactedAt,
      activities: {
        create: {
          companyId: ctx.companyId,
          userId: ctx.id,
          type: "STATUS_CHANGE",
          note: `Lead status changed to ${status}.`,
        },
      },
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      property: true,
    },
  });

  if (status === "VISIT") {
    await calendarService
      .upsertEvent({
        title: `Property visit: ${updatedLead.fullName}`,
        description: updatedLead.property
          ? `Visit scheduled for ${updatedLead.property.title}.`
          : "Lead visit follow-up.",
        start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        attendeeEmail: updatedLead.email ?? undefined,
      })
      .catch((error) => console.warn("Calendar sync skipped", error));
  }

  if (status === "CLOSED" && updatedLead.assignedToId && updatedLead.propertyId) {
    const existingCommission = await prisma.commission.findFirst({
      where: {
        companyId: ctx.companyId,
        leadId: updatedLead.id,
      },
    });

    if (!existingCommission && updatedLead.property?.price) {
      const propertyPrice = Number(updatedLead.property.price);
      await prisma.commission.create({
        data: {
          companyId: ctx.companyId,
          userId: updatedLead.assignedToId,
          leadId: updatedLead.id,
          amount: propertyPrice * 0.015,
          status: "PENDING",
          closedAt: new Date(),
        },
      });
    }
  }

  return updatedLead;
}
