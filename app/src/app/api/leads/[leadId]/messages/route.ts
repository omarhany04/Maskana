import { NextRequest } from "next/server";

import { leadCommunicationSchema } from "@real-estate-crm/shared";

import { handleApiError, jsonSuccess } from "@/lib/api-response";
import { getTenantContext } from "@/lib/tenant";
import { listLeadMessages, sendLeadMessage } from "@/lib/services/messages.service";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { leadId: string } }) {
  try {
    const ctx = await getTenantContext();
    const response = await listLeadMessages(ctx, params.leadId);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { leadId: string } }) {
  try {
    const ctx = await getTenantContext();
    const payload = leadCommunicationSchema.parse(await request.json());
    const response = await sendLeadMessage(ctx, params.leadId, payload);
    return jsonSuccess(response, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
