import bcrypt from "bcryptjs";
import type { SessionUser } from "@real-estate-crm/shared";

import { ApiError } from "@/lib/api-response";
import { buildPaginationMeta, getPagination } from "@/lib/pagination";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type UserListQuery = {
  page: number;
  limit: number;
  q?: string;
  role?: "ADMIN" | "MANAGER" | "AGENT";
};

type UserInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: "ADMIN" | "MANAGER" | "AGENT";
  phone?: string | null;
  isActive?: boolean;
};

function assertAdmin(ctx: SessionUser) {
  if (!isAdmin(ctx.role)) {
    throw new ApiError(403, "Admin access required.");
  }
}

export async function listUsers(ctx: SessionUser, query: UserListQuery) {
  assertAdmin(ctx);

  const { page, limit, skip, take } = getPagination(query.page, query.limit);

  const where = {
    companyId: ctx.companyId,
    ...(query.role ? { role: query.role } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" as const } },
            { email: { contains: query.q, mode: "insensitive" as const } },
            { phone: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            assignedLeads: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    meta: buildPaginationMeta(page, limit, total),
  };
}

export async function createUser(ctx: SessionUser, input: UserInput) {
  assertAdmin(ctx);

  const passwordHash = await bcrypt.hash(input.password ?? "Password123!", 12);

  return prisma.user.create({
    data: {
      companyId: ctx.companyId,
      name: input.name ?? "",
      email: input.email ?? "",
      passwordHash,
      role: input.role ?? "AGENT",
      phone: input.phone || null,
      isActive: input.isActive ?? true,
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
}

export async function updateUser(ctx: SessionUser, userId: string, input: UserInput) {
  assertAdmin(ctx);

  const current = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId: ctx.companyId,
    },
  });

  if (!current) {
    throw new ApiError(404, "User not found.");
  }

  const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : undefined;

  return prisma.user.update({
    where: {
      id: current.id,
    },
    data: {
      name: input.name ?? current.name,
      email: input.email ?? current.email,
      role: input.role ?? current.role,
      phone: input.phone ?? current.phone,
      isActive: input.isActive ?? current.isActive,
      ...(passwordHash ? { passwordHash } : {}),
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
}

export async function deleteUser(ctx: SessionUser, userId: string) {
  assertAdmin(ctx);

  if (ctx.id === userId) {
    throw new ApiError(400, "You cannot delete your own account.");
  }

  const current = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId: ctx.companyId,
    },
  });

  if (!current) {
    throw new ApiError(404, "User not found.");
  }

  await prisma.user.delete({
    where: {
      id: current.id,
    },
  });

  return { success: true };
}

