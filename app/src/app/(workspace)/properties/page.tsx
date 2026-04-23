import { PropertyManagement } from "@/components/properties/PropertyManagement";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { listProperties } from "@/lib/services/properties.service";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const ctx = await getTenantContext();
  const [initialData, agents] = await Promise.all([
    listProperties(ctx, { page: 1, limit: 10 }),
    prisma.user.findMany({
      where: {
        companyId: ctx.companyId,
        role: {
          in: ["AGENT", "MANAGER"],
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <PropertyManagement
      initialData={JSON.parse(JSON.stringify(initialData))}
      agents={JSON.parse(JSON.stringify(agents))}
      currentUser={ctx}
    />
  );
}
