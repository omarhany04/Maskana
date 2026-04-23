import { NextRequest } from "next/server";

import { aiChatSchema } from "@real-estate-crm/shared";

import { aiClient } from "@/lib/ai/client";
import { handleApiError, jsonSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext();
    const payload = aiChatSchema.parse(await request.json());

    await prisma.message.create({
      data: {
        companyId: ctx.companyId,
        leadId: payload.leadId ?? null,
        userId: ctx.id,
        channel: "CHATBOT",
        direction: "INBOUND",
        content: payload.message,
      },
    });

    const response = await aiClient.chat(payload.message, payload.companyId ?? ctx.companyId, payload.leadId);

    await prisma.message.create({
      data: {
        companyId: ctx.companyId,
        leadId: payload.leadId ?? null,
        userId: ctx.id,
        channel: "CHATBOT",
        direction: "OUTBOUND",
        content: response.answer,
        metadata: {
          references: response.references,
        },
      },
    });

    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}
