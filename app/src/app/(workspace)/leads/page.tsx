import { LeadManagement } from "@/components/leads/LeadManagement";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { listLeads } from "@/lib/services/leads.service";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const ctx = await getTenantContext();
  const [initialData, agents, properties] = await Promise.all([
    listLeads(ctx, { page: 1, limit: 10 }),
    prisma.user.findMany({
      where: {
        companyId: ctx.companyId,
        role: "AGENT",
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
    prisma.property.findMany({
      where: {
        companyId: ctx.companyId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        title: true,
        referenceCode: true,
      },
      orderBy: {
        title: "asc",
      },
    }),
  ]);

  return (
    <LeadManagement
      initialData={JSON.parse(JSON.stringify(initialData))}
      agents={JSON.parse(JSON.stringify(agents))}
      currentUser={ctx}
      properties={JSON.parse(JSON.stringify(properties))}
    />
  );
}
