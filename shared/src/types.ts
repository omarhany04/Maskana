import { z } from "zod";

export const roles = ["ADMIN", "MANAGER", "AGENT"] as const;
export const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "VISIT", "CLOSED"] as const;
export const propertyStatuses = ["DRAFT", "ACTIVE", "UNDER_OFFER", "SOLD", "ARCHIVED"] as const;
export const activityTypes = ["NOTE", "CALL", "EMAIL", "VISIT", "STATUS_CHANGE", "ASSIGNMENT"] as const;
export const commissionStatuses = ["PENDING", "APPROVED", "PAID"] as const;
export const messageChannels = ["EMAIL", "WHATSAPP", "CHATBOT", "SYSTEM"] as const;
export const messageDirections = ["INBOUND", "OUTBOUND"] as const;

export type Role = (typeof roles)[number];
export type LeadStatus = (typeof leadStatuses)[number];
export type PropertyStatus = (typeof propertyStatuses)[number];
export type ActivityType = (typeof activityTypes)[number];
export type CommissionStatus = (typeof commissionStatuses)[number];
export type MessageChannel = (typeof messageChannels)[number];
export type MessageDirection = (typeof messageDirections)[number];

export const paginatedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
});

export const leadStatusSchema = z.enum(leadStatuses);
export const propertyStatusSchema = z.enum(propertyStatuses);
export const roleSchema = z.enum(roles);

export interface SessionUser {
  id: string;
  companyId: string;
  role: Role;
  name: string;
  email: string;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalLeads: number;
  conversionRate: number;
  openProperties: number;
  totalAgents: number;
  pipeline: Array<{
    status: LeadStatus;
    count: number;
  }>;
  agentPerformance: Array<{
    userId: string;
    agentName: string;
    totalLeads: number;
    closedLeads: number;
    conversionRate: number;
    totalCommission: number;
  }>;
}

export interface AILeadScoreResponse {
  score: number;
  classification: "cold" | "warm" | "hot";
  reasoning: string[];
}

export interface AIAnalyzeResponse {
  budget: number | null;
  location: string | null;
  propertyType: string | null;
  intent: "buy" | "rent" | "sell" | "invest" | "unknown";
  keywords: string[];
}

export interface AIChatResponse {
  answer: string;
  references: Array<{
    propertyId: string;
    title: string;
    score: number;
  }>;
}

