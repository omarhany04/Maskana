import { addHours } from "date-fns";

import { env } from "@/lib/env";

export interface CalendarEventPayload {
  title: string;
  description?: string;
  start: string;
  end?: string;
  attendeeEmail?: string;
}

interface CalendarProvider {
  upsertEvent(payload: CalendarEventPayload): Promise<void>;
}

async function refreshGoogleAccessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.googleCalendarClientId,
      client_secret: env.googleCalendarClientSecret,
      refresh_token: env.googleCalendarRefreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token refresh failed with ${response.status}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

async function refreshOutlookAccessToken() {
  const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.outlookClientId,
      client_secret: env.outlookClientSecret,
      refresh_token: env.outlookRefreshToken,
      grant_type: "refresh_token",
      scope: "offline_access Calendars.ReadWrite User.Read",
    }),
  });

  if (!response.ok) {
    throw new Error(`Outlook token refresh failed with ${response.status}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

class GoogleCalendarProvider implements CalendarProvider {
  async upsertEvent(payload: CalendarEventPayload) {
    const accessToken = await refreshGoogleAccessToken();
    const end = payload.end ?? addHours(new Date(payload.start), 1).toISOString();

    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        summary: payload.title,
        description: payload.description,
        start: {
          dateTime: payload.start,
        },
        end: {
          dateTime: end,
        },
        attendees: payload.attendeeEmail ? [{ email: payload.attendeeEmail }] : [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Calendar request failed with ${response.status}`);
    }
  }
}

class OutlookCalendarProvider implements CalendarProvider {
  async upsertEvent(payload: CalendarEventPayload) {
    const accessToken = await refreshOutlookAccessToken();
    const end = payload.end ?? addHours(new Date(payload.start), 1).toISOString();

    const response = await fetch("https://graph.microsoft.com/v1.0/me/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        subject: payload.title,
        body: {
          contentType: "HTML",
          content: payload.description ?? "",
        },
        start: {
          dateTime: payload.start,
          timeZone: "UTC",
        },
        end: {
          dateTime: end,
          timeZone: "UTC",
        },
        attendees: payload.attendeeEmail
          ? [
              {
                emailAddress: {
                  address: payload.attendeeEmail,
                },
                type: "required",
              },
            ]
          : [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Outlook Calendar request failed with ${response.status}`);
    }
  }
}

class ConsoleCalendarProvider implements CalendarProvider {
  async upsertEvent(payload: CalendarEventPayload) {
    console.info("Calendar sync", payload);
  }
}

class CalendarService {
  constructor(private readonly provider: CalendarProvider) {}

  upsertEvent(payload: CalendarEventPayload) {
    return this.provider.upsertEvent(payload);
  }
}

const calendarProvider =
  env.googleCalendarClientId && env.googleCalendarClientSecret && env.googleCalendarRefreshToken
    ? new GoogleCalendarProvider()
    : env.outlookClientId && env.outlookClientSecret && env.outlookRefreshToken
      ? new OutlookCalendarProvider()
      : new ConsoleCalendarProvider();

export const calendarService = new CalendarService(calendarProvider);
