import { env } from "@/lib/env";

export interface WhatsAppMessagePayload {
  to: string;
  templateName?: string;
  body: string;
}

export interface WhatsAppDeliveryResult {
  provider: "TWILIO_WHATSAPP";
  providerStatus: string;
  providerMessageId?: string | null;
}

interface WhatsAppProvider {
  sendMessage(payload: WhatsAppMessagePayload): Promise<WhatsAppDeliveryResult>;
}

function normalizeWhatsAppAddress(address: string) {
  const value = address.trim();

  return value.toLowerCase().startsWith("whatsapp:") ? value : `whatsapp:${value}`;
}

class TwilioWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(payload: WhatsAppMessagePayload) {
    const responseBody = new URLSearchParams({
      From: normalizeWhatsAppAddress(env.twilioWhatsAppNumber),
      To: normalizeWhatsAppAddress(payload.to),
      Body: payload.body,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${env.twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${env.twilioAccountSid}:${env.twilioAuthToken}`).toString("base64")}`,
        },
        body: responseBody.toString(),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`WhatsApp request failed with ${response.status}${details ? `: ${details}` : ""}`);
    }

    const payloadResponse = (await response.json()) as { sid?: string; status?: string };

    return {
      provider: "TWILIO_WHATSAPP",
      providerStatus: payloadResponse.status ?? "accepted",
      providerMessageId: payloadResponse.sid ?? null,
    } satisfies WhatsAppDeliveryResult;
  }
}

class ConsoleWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(payload: WhatsAppMessagePayload) {
    console.info("WhatsApp dispatch", payload);
    return {
      provider: "TWILIO_WHATSAPP",
      providerStatus: "accepted",
      providerMessageId: null,
    } satisfies WhatsAppDeliveryResult;
  }
}

class WhatsAppService {
  constructor(private readonly provider: WhatsAppProvider) {}

  sendMessage(payload: WhatsAppMessagePayload) {
    return this.provider.sendMessage(payload);
  }
}

export const whatsAppService = new WhatsAppService(
  env.twilioAccountSid && env.twilioAuthToken && env.twilioWhatsAppNumber
    ? new TwilioWhatsAppProvider()
    : new ConsoleWhatsAppProvider(),
);
