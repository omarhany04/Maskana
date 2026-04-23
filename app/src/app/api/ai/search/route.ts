import { NextRequest } from "next/server";

import { aiSearchSchema } from "@real-estate-crm/shared";

import { aiClient } from "@/lib/ai/client";
import { handleApiError, jsonSuccess } from "@/lib/api-response";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext();
    const payload = aiSearchSchema.parse(await request.json());
    const response = await aiClient.search(payload.query, payload.companyId ?? ctx.companyId, payload.limit);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}
