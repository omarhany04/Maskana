import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { env } from "@/lib/env";
import { getTenantContext } from "@/lib/tenant";
import { getCompanyProfile } from "@/lib/services/company.service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await getTenantContext();
  const company = await getCompanyProfile(ctx);

  return (
    <SettingsPanel
      company={JSON.parse(JSON.stringify(company))}
      currentUser={ctx}
      integrations={{
        ai: Boolean(env.aiServiceUrl),
        s3: Boolean(env.awsS3Bucket && env.awsAccessKeyId && env.awsSecretAccessKey),
        email: Boolean(env.sendGridApiKey),
        whatsapp: Boolean(env.twilioAccountSid && env.twilioAuthToken && env.twilioWhatsAppNumber),
        googleCalendar: Boolean(env.googleCalendarClientId && env.googleCalendarClientSecret && env.googleCalendarRefreshToken),
      }}
    />
  );
}
