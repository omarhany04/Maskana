import type { Role } from "@real-estate-crm/shared";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      companyId: string;
      role: Role;
    };
  }

  interface User {
    id: string;
    companyId: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    companyId?: string;
    role?: Role;
  }
}

