import { NextRequest } from "next/server";

import { propertyUploadSchema } from "@real-estate-crm/shared";

import { handleApiError, jsonSuccess } from "@/lib/api-response";
import { createSignedUploadUrl } from "@/lib/s3";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext();
    const payload = propertyUploadSchema.parse(await request.json());
    const response = await createSignedUploadUrl(ctx.companyId, payload.fileName, payload.contentType);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}
