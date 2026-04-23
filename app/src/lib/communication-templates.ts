import { formatCurrency } from "@/lib/utils";

export const outreachChannels = ["EMAIL", "WHATSAPP"] as const;
export const outreachTemplateKeys = ["property-match", "visit-invitation", "follow-up", "price-update"] as const;

export type OutreachChannel = (typeof outreachChannels)[number];
export type OutreachTemplateKey = (typeof outreachTemplateKeys)[number];

export interface LeadOutreachContext {
  fullName: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  budget?: number | string | null;
  propertyType?: string | null;
  assignedAgentName?: string | null;
  propertyTitle?: string | null;
  propertyReferenceCode?: string | null;
  propertyPrice?: number | string | null;
}

type OutreachDraft = {
  subject?: string;
  body: string;
};

export const outreachTemplateOptions: Record<OutreachChannel, Array<{ key: OutreachTemplateKey; label: string }>> = {
  EMAIL: [
    { key: "property-match", label: "Property match" },
    { key: "visit-invitation", label: "Visit invitation" },
    { key: "follow-up", label: "Follow-up" },
    { key: "price-update", label: "Price update" },
  ],
  WHATSAPP: [
    { key: "property-match", label: "Property match" },
    { key: "visit-invitation", label: "Visit invitation" },
    { key: "follow-up", label: "Follow-up" },
    { key: "price-update", label: "Price update" },
  ],
};

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "there";
}

function getSenderName(context: LeadOutreachContext) {
  return context.assignedAgentName || context.companyName || "our team";
}

function getPropertyLabel(context: LeadOutreachContext) {
  if (!context.propertyTitle) {
    return context.propertyType ? `${context.propertyType} options` : "available listings";
  }

  return context.propertyReferenceCode
    ? `${context.propertyTitle} (${context.propertyReferenceCode})`
    : context.propertyTitle;
}

function getPriceLabel(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "the latest asking price";
  }

  return formatCurrency(value);
}

export function buildOutreachDraft(
  channel: OutreachChannel,
  templateKey: OutreachTemplateKey,
  context: LeadOutreachContext,
): OutreachDraft {
  const firstName = getFirstName(context.fullName);
  const senderName = getSenderName(context);
  const propertyLabel = getPropertyLabel(context);
  const propertyPrice = getPriceLabel(context.propertyPrice ?? context.budget);
  const location = context.location || "your preferred area";

  if (channel === "WHATSAPP") {
    switch (templateKey) {
      case "visit-invitation":
        return {
          body: `Hi ${firstName}, I can help you schedule a visit for ${propertyLabel}. If tomorrow works for you, I can confirm a time and share the exact meeting details.\n\n- ${senderName}`,
        };
      case "follow-up":
        return {
          body: `Hi ${firstName}, just following up on your property search in ${location}. If you want, I can send a fresh shortlist based on your budget and preferred property type.\n\n- ${senderName}`,
        };
      case "price-update":
        return {
          body: `Hi ${firstName}, quick update on ${propertyLabel}: the latest price is ${propertyPrice}. If you want, I can also share similar alternatives in ${location}.\n\n- ${senderName}`,
        };
      case "property-match":
      default:
        return {
          body: `Hi ${firstName}, I found a strong match for you: ${propertyLabel}. It fits well with your search around ${location}, and I can send full details or book a viewing whenever you're ready.\n\n- ${senderName}`,
        };
    }
  }

  switch (templateKey) {
    case "visit-invitation":
      return {
        subject: `Let's schedule your visit for ${propertyLabel}`,
        body: `Hi ${firstName},

I’d be happy to arrange a visit for ${propertyLabel}. If you’re available tomorrow, I can confirm a suitable time and send over the visit details right away.

Reply with your preferred time window and I’ll take care of the rest.

Best regards,
${senderName}`,
      };
    case "follow-up":
      return {
        subject: `Following up on your property search`,
        body: `Hi ${firstName},

I wanted to follow up on your current property search in ${location}. If your preferences or timeline have changed, I can update the shortlist and send you more relevant options.

If you'd like, I can also prepare a new set of recommendations based on your latest budget and property type preferences.

Best regards,
${senderName}`,
      };
    case "price-update":
      return {
        subject: `Price update for ${propertyLabel}`,
        body: `Hi ${firstName},

I wanted to share a quick update on ${propertyLabel}. The latest listed price is ${propertyPrice}.

If you'd like, I can also send comparable options in ${location} so you can evaluate the best fit side by side.

Best regards,
${senderName}`,
      };
    case "property-match":
    default:
      return {
        subject: `A property match for your search`,
        body: `Hi ${firstName},

I found a promising option that fits your current search: ${propertyLabel}.

It stands out based on your interest in ${location}, and I can send the full details, brochure, and next steps if you’d like to review it closely.

Best regards,
${senderName}`,
      };
  }
}
