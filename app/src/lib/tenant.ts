import { headers } from "next/headers";

import type { Role, SessionUser } from "@real-estate-crm/shared";

import { getServerAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-response";

export async function getTenantContext(): Promise<SessionUser> {
  const requestHeaders = headers();
  const userId = requestHeaders.get("x-user-id");
  const companyId = requestHeaders.get("x-company-id");
  const role = requestHeaders.get("x-user-role") as Role | null;
  const name = requestHeaders.get("x-user-name");
  const email = requestHeaders.get("x-user-email");

  if (userId && companyId && role && name && email) {
    return {
      id: userId,
      companyId,
      role,
      name,
      email,
    };
  }

  const session = await getServerAuthSession();

  if (!session?.user?.id || !session.user.companyId || !session.user.role || !session.user.email || !session.user.name) {
    throw new ApiError(401, "Unauthorized");
  }

  return {
    id: session.user.id,
    companyId: session.user.companyId,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
  };
}

export function assertRole(role: Role, allowedRoles: Role[]) {
  if (!allowedRoles.includes(role)) {
    throw new ApiError(403, "Forbidden");
  }
}

