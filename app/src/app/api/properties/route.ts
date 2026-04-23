import { NextRequest } from "next/server";

import { propertyCreateSchema, propertyListQuerySchema } from "@real-estate-crm/shared";

import { handleApiError, jsonSuccess } from "@/lib/api-response";
import { getTenantContext } from "@/lib/tenant";
import { createProperty, listProperties } from "@/lib/services/properties.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext();
    const query = propertyListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const response = await listProperties(ctx, query);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext();
    const payload = propertyCreateSchema.parse(await request.json());
    const response = await createProperty(ctx, payload);
    return jsonSuccess(response, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
