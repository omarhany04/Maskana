import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { getTenantContext } from "@/lib/tenant";
import { getCompanyProfile } from "@/lib/services/company.service";
import { getDashboardStats } from "@/lib/services/dashboard.service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await getTenantContext();
  const [stats, company] = await Promise.all([getDashboardStats(ctx), getCompanyProfile(ctx)]);

  return (
    <DashboardOverview
      company={JSON.parse(JSON.stringify(company))}
      currentUser={ctx}
      stats={JSON.parse(JSON.stringify(stats))}
    />
  );
}
