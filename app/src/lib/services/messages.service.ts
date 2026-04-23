import type { SessionUser } from "@real-estate-crm/shared";

import { ApiError } from "@/lib/api-response";
import { emailService } from "@/lib/integrations/email";
import { whatsAppService } from "@/lib/integrations/whatsapp";
import { isAgent } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type LeadCommunicationInput = {
  channel: "EMAIL" | "WHATSAPP";
  subject?: string;
  body: string;
  templateKey?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildEmailHtml(body: string) {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px">${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

async function ensureLeadMessagingAccess(ctx: SessionUser, leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      companyId: ctx.companyId,
      ...(isAgent(ctx.role) ? { assignedToId: ctx.id } : {}),
    },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          referenceCode: true,
          price: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  if (!lead) {
    throw new ApiError(404, "Lead not found.");
  }

  return lead;
}

export async function listLeadMessages(ctx: SessionUser, leadId: string) {
  await ensureLeadMessagingAccess(ctx, leadId);

  return prisma.message.findMany({
    where: {
      companyId: ctx.companyId,
      leadId,
      channel: {
        in: ["EMAIL", "WHATSAPP"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function sendLeadMessage(ctx: SessionUser, leadId: string, input: LeadCommunicationInput) {
  const lead = await ensureLeadMessagingAccess(ctx, leadId);
  const body = input.body.trim();
  const subject = input.subject?.trim();
  const now = new Date();

  if (input.channel === "EMAIL") {
    if (!lead.email) {
      throw new ApiError(400, "This lead does not have an email address.");
    }

    if (!subject) {
      throw new ApiError(422, "Email subject is required.");
    }

    await emailService.send({
      to: lead.email,
      subject,
      html: buildEmailHtml(body),
      text: body,
    });
  }

  if (input.channel === "WHATSAPP") {
    if (!lead.phone) {
      throw new ApiError(400, "This lead does not have a phone number for WhatsApp.");
    }

    await whatsAppService.sendMessage({
      to: lead.phone,
      body,
    });
  }

  const nextStatus = lead.status === "NEW" ? "CONTACTED" : lead.status;
  const activityType = input.channel === "EMAIL" ? "EMAIL" : "NOTE";
  const activityNote =
    input.channel === "EMAIL"
      ? `Email sent${subject ? `: ${subject}` : "."}`
      : "WhatsApp message sent to the lead.";

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        companyId: ctx.companyId,
        leadId: lead.id,
        userId: ctx.id,
        channel: input.channel,
        direction: "OUTBOUND",
        content: body,
        metadata: {
          subject: subject ?? null,
          templateKey: input.templateKey ?? null,
          recipient: input.channel === "EMAIL" ? lead.email : lead.phone,
          propertyTitle: lead.property?.title ?? null,
          propertyReferenceCode: lead.property?.referenceCode ?? null,
          sentAt: now.toISOString(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await tx.lead.update({
      where: {
        id: lead.id,
      },
      data: {
        status: nextStatus,
        lastContactedAt: now,
        activities: {
          create: {
            companyId: ctx.companyId,
            userId: ctx.id,
            type: activityType,
            note: activityNote,
          },
        },
      },
    });

    return created;
  });

  return {
    message,
    lead: {
      id: lead.id,
      status: nextStatus,
      lastContactedAt: now.toISOString(),
    },
  };
}
