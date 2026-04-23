"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Mail, MessageSquare, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  buildOutreachDraft,
  outreachTemplateOptions,
  type OutreachChannel,
  type OutreachTemplateKey,
} from "@/lib/communication-templates";
import { isE164PhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { formatCurrency } from "@/lib/utils";

type LeadMessageRecord = {
  id: string;
  channel: "EMAIL" | "WHATSAPP" | string;
  direction: "INBOUND" | "OUTBOUND" | string;
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  user?: {
    id: string;
    name: string | null;
  } | null;
};

type CommunicationLead = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: string;
  budget: number | string | null;
  location: string | null;
  propertyType: string | null;
  assignedTo: {
    id: string;
    name: string;
    role: string;
  } | null;
  property: {
    id: string;
    title: string;
    referenceCode: string;
    price: number | string;
  } | null;
};

function formatMessageDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getMetadataValue(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function formatProviderStatus(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.replaceAll("_", " ").toLowerCase();
}

function getDefaultChannel(lead: CommunicationLead): OutreachChannel {
  if (lead.email) {
    return "EMAIL";
  }

  return "WHATSAPP";
}

function getDefaultTemplate(lead: CommunicationLead): OutreachTemplateKey {
  if (lead.status === "VISIT") {
    return "visit-invitation";
  }

  if (lead.property) {
    return "property-match";
  }

  return "follow-up";
}

export function LeadCommunicationPanel({
  companyName,
  lead,
  onSent,
}: {
  companyName: string;
  lead: CommunicationLead;
  onSent?: () => void | Promise<void>;
}) {
  const [channel, setChannel] = useState<OutreachChannel>(getDefaultChannel(lead));
  const [templateKey, setTemplateKey] = useState<OutreachTemplateKey>(getDefaultTemplate(lead));
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [messages, setMessages] = useState<LeadMessageRecord[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const hasEmail = Boolean(lead.email);
  const hasWhatsApp = Boolean(lead.phone);
  const normalizedWhatsApp = normalizePhoneNumber(lead.phone);
  const hasValidWhatsApp = isE164PhoneNumber(normalizedWhatsApp);
  const hasAvailableChannel = hasEmail || hasWhatsApp;

  function applyTemplate(nextChannel: OutreachChannel, nextTemplateKey: OutreachTemplateKey) {
    const draft = buildOutreachDraft(nextChannel, nextTemplateKey, {
      fullName: lead.fullName,
      companyName,
      email: lead.email,
      phone: lead.phone,
      location: lead.location,
      budget: lead.budget,
      propertyType: lead.propertyType,
      assignedAgentName: lead.assignedTo?.name ?? null,
      propertyTitle: lead.property?.title ?? null,
      propertyReferenceCode: lead.property?.referenceCode ?? null,
      propertyPrice: lead.property?.price ?? null,
    });

    setChannel(nextChannel);
    setTemplateKey(nextTemplateKey);
    setSubject(draft.subject ?? "");
    setBody(draft.body);
    setFeedback(null);
  }

  useEffect(() => {
    applyTemplate(getDefaultChannel(lead), getDefaultTemplate(lead));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id, companyName]);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      setIsLoadingHistory(true);
      setHistoryError(null);

      try {
        const response = await fetch(`/api/leads/${lead.id}/messages`, { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message ?? "Unable to load communication history.");
        }

        if (!cancelled) {
          setMessages(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setHistoryError(error instanceof Error ? error.message : "Unable to load communication history.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    }

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [lead.id]);

  async function handleSend() {
    setIsSending(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/leads/${lead.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          subject: channel === "EMAIL" ? subject : undefined,
          body,
          templateKey,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to send outreach.");
      }

      setMessages((current) => [payload.message, ...current]);
      const providerStatus = formatProviderStatus(getMetadataValue(payload.message?.metadata, "providerStatus"));
      setFeedback(
        channel === "EMAIL"
          ? `Email ${providerStatus ?? "accepted"} by the provider and logged on the lead timeline.`
          : `WhatsApp message ${providerStatus ?? "accepted"} by the provider and logged on the lead timeline.`,
      );

      if (payload.lead?.status === "CONTACTED" && lead.status === "NEW") {
        setFeedback(
          channel === "EMAIL"
            ? `Email ${providerStatus ?? "accepted"}, logged, and the lead was moved to CONTACTED.`
            : `WhatsApp message ${providerStatus ?? "accepted"}, logged, and the lead was moved to CONTACTED.`,
        );
      }

      await onSent?.();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to send outreach.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mt-6 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sea-100 p-3">
              <MessageSquare className="h-5 w-5 text-sea-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sea-700">Lead outreach</p>
              <h3 className="mt-1 text-xl font-bold text-ink">Send email or WhatsApp without leaving the CRM</h3>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Every message is saved to the lead timeline, and sending outreach automatically updates brand-new leads to
            <span className="mx-1 inline-flex rounded-full bg-sea-100 px-2 py-0.5 text-xs font-semibold text-sea-700">
              CONTACTED
            </span>
            so the pipeline stays accurate.
          </p>
        </div>

        <div className="grid gap-3 rounded-3xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-600 md:min-w-[300px]">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-700">Lead</span>
            <span>{lead.fullName}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-700">Email</span>
            <span className={hasEmail ? "text-slate-700" : "text-rose-600"}>{lead.email ?? "Missing"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-700">WhatsApp</span>
            <span className={hasWhatsApp ? "text-slate-700" : "text-rose-600"}>{lead.phone ?? "Missing"}</span>
          </div>
          {hasValidWhatsApp && normalizedWhatsApp && lead.phone && normalizedWhatsApp !== lead.phone ? (
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-slate-700">WhatsApp send-to</span>
              <span>{normalizedWhatsApp}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-700">Property</span>
            <span>{lead.property?.referenceCode ?? "None linked"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-700">Budget</span>
            <span>{lead.budget ? formatCurrency(lead.budget) : "N/A"}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/80 p-5">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant={channel === "EMAIL" ? "primary" : "secondary"}
              disabled={!hasEmail}
              onClick={() => applyTemplate("EMAIL", templateKey)}
            >
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button
              type="button"
              variant={channel === "WHATSAPP" ? "primary" : "secondary"}
              disabled={!hasWhatsApp}
              onClick={() => applyTemplate("WHATSAPP", templateKey)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Template</span>
            <select
              value={templateKey}
              onChange={(event) => applyTemplate(channel, event.target.value as OutreachTemplateKey)}
              className="w-full rounded-2xl border-slate-200 bg-white text-sm"
            >
              {outreachTemplateOptions[channel].map((template) => (
                <option key={template.key} value={template.key}>
                  {template.label}
                </option>
              ))}
            </select>
          </label>

          {channel === "EMAIL" ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Subject</span>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="w-full rounded-2xl border-slate-200 bg-white text-sm"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Message</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-52 w-full rounded-2xl border-slate-200 bg-white text-sm"
            />
          </label>

          {!hasAvailableChannel ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Add an email address or phone number to this lead before sending outreach.
            </div>
          ) : null}

          {channel === "WHATSAPP" && hasWhatsApp && hasValidWhatsApp && normalizedWhatsApp !== lead.phone ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              We will automatically send this WhatsApp message using <code>{normalizedWhatsApp}</code>.
            </div>
          ) : null}

          {channel === "WHATSAPP" && hasWhatsApp && !hasValidWhatsApp ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Update the lead phone to international format before sending on WhatsApp. Example: <code>+201093456760</code>
            </div>
          ) : null}

          {feedback ? (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                feedback.toLowerCase().includes("unable") || feedback.toLowerCase().includes("required") || feedback.toLowerCase().includes("missing")
                  ? "bg-rose-50 text-rose-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {feedback}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sea-700" />
              Templates are fully editable before you send.
            </div>
            <Button
              type="button"
              onClick={() => void handleSend()}
              disabled={
                isSending ||
                 !hasAvailableChannel ||
                 !body.trim() ||
                 (channel === "EMAIL" && !hasEmail) ||
                 (channel === "WHATSAPP" && (!hasWhatsApp || !hasValidWhatsApp)) ||
                 (channel === "EMAIL" && !subject.trim())
               }
             >
              <Send className="mr-2 h-4 w-4" />
              {isSending ? "Sending..." : `Send ${channel === "EMAIL" ? "email" : "WhatsApp"}`}
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sea-700">Communication history</p>
              <h3 className="mt-1 text-xl font-bold text-ink">Recent outreach on this lead</h3>
            </div>
            <div className="rounded-2xl bg-gold-100 p-3">
              <CalendarDays className="h-5 w-5 text-gold-700" />
            </div>
          </div>

          {isLoadingHistory ? (
            <p className="mt-5 text-sm text-slate-500">Loading communication history...</p>
          ) : historyError ? (
            <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{historyError}</div>
          ) : messages.length > 0 ? (
            <div className="mt-5 space-y-3">
              {messages.map((message) => {
                const subjectLine = getMetadataValue(message.metadata, "subject");
                const recipient = getMetadataValue(message.metadata, "recipient");
                const provider = getMetadataValue(message.metadata, "provider");
                const providerStatus = formatProviderStatus(getMetadataValue(message.metadata, "providerStatus"));

                return (
                  <div key={message.id} className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge value={message.channel} />
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{message.direction}</span>
                      </div>
                      <span className="text-xs text-slate-500">{formatMessageDate(message.createdAt)}</span>
                    </div>
                    {subjectLine ? <p className="mt-3 text-sm font-semibold text-slate-700">{subjectLine}</p> : null}
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{message.content}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {recipient ? <span>Recipient: {recipient}</span> : null}
                      {provider ? <span>Provider: {provider.replaceAll("_", " ")}</span> : null}
                      {providerStatus ? <span>Status: {providerStatus}</span> : null}
                      {message.user?.name ? <span>Sent by: {message.user.name}</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-sm text-slate-500">
              No email or WhatsApp messages have been sent to this lead yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
