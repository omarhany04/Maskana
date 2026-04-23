import { NextRequest } from "next/server";

import { leadUpdateSchema } from "@real-estate-crm/shared";

import { handleApiError, jsonSuccess } from "@/lib/api-response";
import { getTenantContext } from "@/lib/tenant";
import { deleteLead, getLeadById, updateLead } from "@/lib/services/leads.service";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { leadId: string } }) {
  try {
    const ctx = await getTenantContext();
    const response = await getLeadById(ctx, params.leadId);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { leadId: string } }) {
  try {
    const ctx = await getTenantContext();
    const payload = leadUpdateSchema.parse(await request.json());
    const response = await updateLead(ctx, params.leadId, payload);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { leadId: string } }) {
  try {
    const ctx = await getTenantContext();
    const response = await deleteLead(ctx, params.leadId);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}
