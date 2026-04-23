import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonSuccess } from "@/lib/api-response";
import { getTenantContext } from "@/lib/tenant";
import { getCompanyProfile, updateCompanyProfile } from "@/lib/services/company.service";

export const dynamic = "force-dynamic";

const companySettingsSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  brandColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/).optional(),
  locale: z.string().min(2).max(20).optional(),
  currency: z.string().min(3).max(10).optional(),
});

export async function GET() {
  try {
    const ctx = await getTenantContext();
    const response = await getCompanyProfile(ctx);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getTenantContext();
    const payload = companySettingsSchema.parse(await request.json());
    const response = await updateCompanyProfile(ctx, payload);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}
