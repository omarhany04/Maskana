import { Prisma } from "@prisma/client";
import type { DashboardStats, SessionUser } from "@real-estate-crm/shared";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats(ctx: SessionUser): Promise<DashboardStats> {
  const leadScope: Prisma.LeadWhereInput = {
    companyId: ctx.companyId,
    ...(ctx.role === "AGENT" ? { assignedToId: ctx.id } : {}),
  };

  const [totalLeads, closedLeads, openProperties, totalAgents, pipelineRaw, agentUsers] = await Promise.all([
    prisma.lead.count({
      where: leadScope,
    }),
    prisma.lead.count({
      where: {
        ...leadScope,
        status: "CLOSED",
      },
    }),
    prisma.property.count({
      where: {
        companyId: ctx.companyId,
        status: "ACTIVE",
      },
    }),
    prisma.user.count({
      where: {
        companyId: ctx.companyId,
        role: "AGENT",
        isActive: true,
      },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: leadScope,
      _count: {
        status: true,
      },
    }),
    prisma.user.findMany({
      where: {
        companyId: ctx.companyId,
        isActive: true,
        ...(ctx.role === "AGENT" ? { id: ctx.id } : { role: "AGENT" }),
      },
      select: {
        id: true,
        name: true,
        assignedLeads: {
          select: {
            id: true,
            status: true,
          },
        },
        commissions: {
          select: {
            amount: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const agentPerformance = agentUsers.map((user) => {
    const totalAssigned = user.assignedLeads.length;
    const totalClosed = user.assignedLeads.filter((lead) => lead.status === "CLOSED").length;

    return {
      userId: user.id,
      agentName: user.name,
      totalLeads: totalAssigned,
      closedLeads: totalClosed,
      conversionRate: totalAssigned === 0 ? 0 : (totalClosed / totalAssigned) * 100,
      totalCommission: user.commissions.reduce((sum, commission) => sum + Number(commission.amount), 0),
    };
  });

  return {
    totalLeads,
    conversionRate: totalLeads === 0 ? 0 : (closedLeads / totalLeads) * 100,
    openProperties,
    totalAgents,
    pipeline: pipelineRaw.map((entry) => ({
      status: entry.status,
      count: entry._count.status,
    })),
    agentPerformance,
  };
}

