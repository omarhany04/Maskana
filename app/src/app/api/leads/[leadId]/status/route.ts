import { NextRequest } from "next/server";

import { leadStatusUpdateSchema } from "@real-estate-crm/shared";

import { handleApiError, jsonSuccess } from "@/lib/api-response";
import { getTenantContext } from "@/lib/tenant";
import { updateLeadStatus } from "@/lib/services/leads.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { leadId: string } }) {
  try {
    const ctx = await getTenantContext();
    const payload = leadStatusUpdateSchema.parse(await request.json());
    const response = await updateLeadStatus(ctx, params.leadId, payload.status);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}
