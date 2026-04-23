import { NextRequest } from "next/server";

import { aiLeadScoreSchema } from "@real-estate-crm/shared";

import { aiClient } from "@/lib/ai/client";
import { handleApiError, jsonSuccess } from "@/lib/api-response";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await getTenantContext();
    const payload = aiLeadScoreSchema.parse(await request.json());
    const response = await aiClient.leadScore(payload.lead);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}
