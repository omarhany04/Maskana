import type { SessionUser } from "@real-estate-crm/shared";

import { ApiError } from "@/lib/api-response";
import { emailService } from "@/lib/integrations/email";
import { whatsAppService } from "@/lib/integrations/whatsapp";
import { isE164PhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { isAgent } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type LeadCommunicationInput = {
  channel: "EMAIL" | "WHATSAPP";
  subject?: string;
  body: string;
  templateKey?: string;
};

function getDeliveryErrorMessage(channel: LeadCommunicationInput["channel"], error: unknown) {
  const fallback =
    channel === "EMAIL"
      ? "Email delivery failed. Please check the email provider configuration."
      : "WhatsApp delivery failed. Please check the Twilio configuration.";

  if (!(error instanceof Error) || !error.message.trim()) {
    return fallback;
  }

  const message = error.message.trim();

  if (channel === "EMAIL") {
    if (message.includes("verified Sender Identity")) {
      return "Email delivery failed: the configured SendGrid sender address is not verified.";
    }

    if (message.includes("401")) {
      return "Email delivery failed: SendGrid rejected the API key.";
    }

    return `Email delivery failed: ${message}`;
  }

  if (message.includes("63015")) {
    return "WhatsApp delivery failed: the recipient must join your Twilio WhatsApp sandbox first, and the sandbox session must still be active.";
  }

  if (message.includes("21211")) {
    return "WhatsApp delivery failed: the lead phone number must be in international E.164 format, for example +201093456760.";
  }

  if (message.toLowerCase().includes("template")) {
    return "WhatsApp delivery failed: Twilio requires an approved template or an active 24-hour WhatsApp session for this recipient.";
  }

  if (message.includes("401")) {
    return "WhatsApp delivery failed: Twilio rejected the account credentials.";
  }

  return `WhatsApp delivery failed: ${message}`;
}

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
  let providerResult:
    | {
        provider: string;
        providerStatus: string;
        providerMessageId?: string | null;
      }
    | undefined;

  if (input.channel === "EMAIL") {
    if (!lead.email) {
      throw new ApiError(400, "This lead does not have an email address.");
    }

    if (!subject) {
      throw new ApiError(422, "Email subject is required.");
    }

    try {
      providerResult = await emailService.send({
        to: lead.email,
        subject,
        html: buildEmailHtml(body),
        text: body,
      });
    } catch (error) {
      console.error("Email delivery failed", error);
      throw new ApiError(502, getDeliveryErrorMessage("EMAIL", error));
    }
  }

  if (input.channel === "WHATSAPP") {
    if (!lead.phone) {
      throw new ApiError(400, "This lead does not have a phone number for WhatsApp.");
    }

    const normalizedPhone = normalizePhoneNumber(lead.phone);

    if (!normalizedPhone || !isE164PhoneNumber(normalizedPhone)) {
      throw new ApiError(
        422,
        "WhatsApp delivery failed: the lead phone number must be in international E.164 format, for example +201093456760.",
      );
    }

    try {
      providerResult = await whatsAppService.sendMessage({
        to: normalizedPhone,
        body,
      });
    } catch (error) {
      console.error("WhatsApp delivery failed", error);
      throw new ApiError(502, getDeliveryErrorMessage("WHATSAPP", error));
    }
  }

  const nextStatus = lead.status === "NEW" ? "CONTACTED" : lead.status;
  const activityType = input.channel === "EMAIL" ? "EMAIL" : "NOTE";
  const providerStatusLabel = providerResult?.providerStatus ?? "accepted";
  const activityNote =
    input.channel === "EMAIL"
      ? `Email ${providerStatusLabel} by provider${subject ? `: ${subject}` : "."}`
      : `WhatsApp message ${providerStatusLabel} by provider.`;

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
          recipient: input.channel === "EMAIL" ? lead.email : normalizePhoneNumber(lead.phone),
          provider: providerResult?.provider ?? null,
          providerStatus: providerResult?.providerStatus ?? null,
          providerMessageId: providerResult?.providerMessageId ?? null,
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
        ...(input.channel === "WHATSAPP" && lead.phone
          ? {
              phone: normalizePhoneNumber(lead.phone),
            }
          : {}),
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
