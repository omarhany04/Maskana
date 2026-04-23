import { handleApiError, jsonSuccess } from "@/lib/api-response";
import { getTenantContext } from "@/lib/tenant";
import { getDashboardStats } from "@/lib/services/dashboard.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await getTenantContext();
    const response = await getDashboardStats(ctx);
    return jsonSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}
