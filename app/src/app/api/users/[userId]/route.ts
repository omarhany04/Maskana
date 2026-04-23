import { NextRequest } from "next/server";

import { userUpdateSchema } from "@real-estate-crm/shared";

import { ApiError, handleApiError, jsonSuccess } from "@/lib/api-response";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { deleteUser, updateUser } from "@/lib/services/users.service";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const ctx = await getTenantContext();

    if (!isAdmin(ctx.role)) {
      throw new ApiError(403, "Forbidden");
    }

    const user = await prisma.user.findFirst({
      where: {
        id: params.userId,
        companyId: ctx.companyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return jsonSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const ctx = await getTenantContext();
    const payload = userUpdateSchema.parse(await request.json());
    const response = await updateUser(ctx, params.userId, payload);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const ctx = await getTenantContext();
    const response = await deleteUser(ctx, params.userId);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}
