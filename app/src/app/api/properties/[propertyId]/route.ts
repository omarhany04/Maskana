import { NextRequest } from "next/server";

import { propertyUpdateSchema } from "@real-estate-crm/shared";

import { handleApiError, jsonSuccess } from "@/lib/api-response";
import { getTenantContext } from "@/lib/tenant";
import { deleteProperty, getPropertyById, updateProperty } from "@/lib/services/properties.service";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { propertyId: string } }) {
  try {
    const ctx = await getTenantContext();
    const response = await getPropertyById(ctx, params.propertyId);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { propertyId: string } }) {
  try {
    const ctx = await getTenantContext();
    const payload = propertyUpdateSchema.parse(await request.json());
    const response = await updateProperty(ctx, params.propertyId, payload);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { propertyId: string } }) {
  try {
    const ctx = await getTenantContext();
    const response = await deleteProperty(ctx, params.propertyId);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}
