import { NextRequest } from "next/server";

import { userCreateSchema, userListQuerySchema } from "@real-estate-crm/shared";

import { handleApiError, jsonSuccess } from "@/lib/api-response";
import { getTenantContext } from "@/lib/tenant";
import { createUser, listUsers } from "@/lib/services/users.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext();
    const query = userListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const response = await listUsers(ctx, query);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext();
    const payload = userCreateSchema.parse(await request.json());
    const response = await createUser(ctx, payload);
    return jsonSuccess(response, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
