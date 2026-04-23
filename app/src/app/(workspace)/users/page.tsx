import { redirect } from "next/navigation";

import { UserManagement } from "@/components/users/UserManagement";
import { getTenantContext } from "@/lib/tenant";
import { listUsers } from "@/lib/services/users.service";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const ctx = await getTenantContext();

  if (ctx.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const initialData = await listUsers(ctx, { page: 1, limit: 10 });

  return <UserManagement currentUser={ctx} initialData={JSON.parse(JSON.stringify(initialData))} />;
}
