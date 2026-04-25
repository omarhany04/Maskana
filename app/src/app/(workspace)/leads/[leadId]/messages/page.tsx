import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";

import { LeadCommunicationPanel } from "@/components/leads/LeadCommunicationPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCompanyProfile } from "@/lib/services/company.service";
import { getLeadById } from "@/lib/services/leads.service";
import { getTenantContext } from "@/lib/tenant";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeadMessagesPage({ params }: { params: { leadId: string } }) {
  const ctx = await getTenantContext();

  const [lead, company] = await Promise.all([
    getLeadById(ctx, params.leadId).catch(() => null),
    getCompanyProfile(ctx),
  ]);

  if (!lead) {
    notFound();
  }

  const serializedLead = JSON.parse(JSON.stringify(lead));
  const budget = lead.budget ? Number(lead.budget) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lead outreach"
        title={`Message ${lead.fullName}`}
        description="Compose email or WhatsApp follow-up in a focused workspace with the full communication history beside it."
        action={
          <Link
            href="/leads"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200/90 bg-white/90 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sea-200 hover:bg-sea-50/90 hover:text-sea-800 hover:shadow-crisp focus:outline-none focus:ring-4 focus:ring-sea-200/60"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to leads
          </Link>
        }
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="metric-tile">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sea-100 p-3">
              <MessageSquare className="h-4 w-4 text-sea-700" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Pipeline status</p>
              <div className="mt-1">
                <StatusBadge value={lead.status} />
              </div>
            </div>
          </div>
        </div>
        <div className="metric-tile">
          <p className="text-xs font-bold uppercase text-slate-500">Contact</p>
          <p className="mt-2 truncate text-sm font-semibold text-ink">{lead.email ?? lead.phone ?? "No contact method"}</p>
        </div>
        <div className="metric-tile">
          <p className="text-xs font-bold uppercase text-slate-500">Budget</p>
          <p className="mt-2 text-sm font-semibold text-ink">{budget ? formatCurrency(budget) : "N/A"}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gold-100 p-3">
              <Mail className="h-4 w-4 text-gold-700" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Linked listing</p>
              <p className="mt-1 truncate text-sm font-semibold text-ink">{lead.property?.referenceCode ?? "None"}</p>
            </div>
          </div>
        </div>
      </section>

      <LeadCommunicationPanel companyName={company.name} lead={serializedLead} />
    </div>
  );
}
