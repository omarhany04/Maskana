import { env } from "@/lib/env";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailProvider {
  send(payload: EmailPayload): Promise<void>;
}

class SendGridEmailProvider implements EmailProvider {
  async send(payload: EmailPayload) {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.sendGridApiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: payload.to }],
            subject: payload.subject,
          },
        ],
        from: { email: env.sendGridFromEmail },
        content: [
          { type: "text/plain", value: payload.text ?? payload.html.replace(/<[^>]+>/g, " ") },
          { type: "text/html", value: payload.html },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid request failed with ${response.status}`);
    }
  }
}

class ConsoleEmailProvider implements EmailProvider {
  async send(payload: EmailPayload) {
    console.info("Email dispatch", payload);
  }
}

class EmailService {
  constructor(private readonly provider: EmailProvider) {}

  send(payload: EmailPayload) {
    return this.provider.send(payload);
  }
}

export const emailService = new EmailService(
  env.sendGridApiKey ? new SendGridEmailProvider() : new ConsoleEmailProvider(),
);

