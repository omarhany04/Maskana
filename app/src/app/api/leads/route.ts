import { NextRequest } from "next/server";

import { leadCreateSchema, leadListQuerySchema } from "@real-estate-crm/shared";

import { handleApiError, jsonSuccess } from "@/lib/api-response";
import { getTenantContext } from "@/lib/tenant";
import { createLead, listLeads } from "@/lib/services/leads.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext();
    const query = leadListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const response = await listLeads(ctx, query);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext();
    const payload = leadCreateSchema.parse(await request.json());
    const response = await createLead(ctx, payload);
    return jsonSuccess(response, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
