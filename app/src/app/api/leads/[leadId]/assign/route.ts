import { NextRequest } from "next/server";

import { leadAssignSchema } from "@real-estate-crm/shared";

import { handleApiError, jsonSuccess } from "@/lib/api-response";
import { getTenantContext } from "@/lib/tenant";
import { assignLead } from "@/lib/services/leads.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { leadId: string } }) {
  try {
    const ctx = await getTenantContext();
    const payload = leadAssignSchema.parse(await request.json());
    const response = await assignLead(ctx, params.leadId, payload.assignedToId);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}
