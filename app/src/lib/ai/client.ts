import type { AIAnalyzeResponse, AIChatResponse, AILeadScoreResponse } from "@real-estate-crm/shared";

import { env } from "@/lib/env";

async function aiRequest<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${env.aiServiceUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`AI service error: ${response.status}`);
  }

  return (await response.json()) as T;
}

export const aiClient = {
  analyze(query: string) {
    return aiRequest<AIAnalyzeResponse>("/analyze", { query });
  },
  leadScore(lead: Record<string, unknown>) {
    return aiRequest<AILeadScoreResponse>("/lead-score", { lead });
  },
  search(query: string, companyId?: string, limit = 10) {
    return aiRequest<{ matches: Array<Record<string, unknown>> }>("/search", {
      query,
      companyId,
      limit,
    });
  },
  chat(message: string, companyId?: string, leadId?: string) {
    return aiRequest<AIChatResponse>("/chat", {
      message,
      companyId,
      leadId,
    });
  },
  async indexProperties(companyId: string, properties: Array<Record<string, unknown>>) {
    try {
      await aiRequest<{ indexed: number }>("/index/properties", {
        companyId,
        properties,
      });
    } catch (error) {
      console.warn("AI indexing skipped", error);
    }
  },
};

