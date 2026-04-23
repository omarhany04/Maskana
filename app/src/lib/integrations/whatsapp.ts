import { env } from "@/lib/env";

export interface WhatsAppMessagePayload {
  to: string;
  templateName?: string;
  body: string;
}

interface WhatsAppProvider {
  sendMessage(payload: WhatsAppMessagePayload): Promise<void>;
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
  }
}

class ConsoleWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(payload: WhatsAppMessagePayload) {
    console.info("WhatsApp dispatch", payload);
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
