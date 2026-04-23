import { z } from "zod";

import {
  leadStatuses,
  messageChannels,
  paginatedQuerySchema,
  propertyStatuses,
  roles,
} from "./types";

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? null : value), schema.nullable().optional());

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const leadCreateSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: emptyToUndefined(z.string().email()),
  phone: emptyToUndefined(z.string().min(6).max(30)),
  source: z.string().min(2).max(80),
  status: z.enum(leadStatuses).default("NEW"),
  budget: z.coerce.number().min(0).optional().nullable(),
  location: emptyToNull(z.string().min(2).max(120)),
  propertyType: emptyToNull(z.string().min(2).max(60)),
  intent: emptyToNull(z.string().min(2).max(60)),
  notes: emptyToNull(z.string().max(2000)),
  assignedToId: emptyToNull(z.string().cuid()),
  propertyId: emptyToNull(z.string().cuid()),
});

export const leadUpdateSchema = leadCreateSchema.partial();

export const leadAssignSchema = z.object({
  assignedToId: z.string().cuid(),
});

export const leadStatusUpdateSchema = z.object({
  status: z.enum(leadStatuses),
});

export const propertyCreateSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(4000),
  propertyType: z.string().min(2).max(60),
  location: z.string().min(2).max(140),
  address: z.string().min(4).max(240),
  price: z.coerce.number().min(0),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  areaSqm: z.coerce.number().min(0),
  status: z.enum(propertyStatuses).default("ACTIVE"),
  imageUrls: z.array(z.string().url()).default([]),
  listedById: emptyToNull(z.string().cuid()),
});

export const propertyUpdateSchema = propertyCreateSchema.partial();

export const userCreateSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(roles),
  phone: emptyToNull(z.string().min(6).max(30)),
  isActive: z.boolean().default(true),
});

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true }).extend({
  password: z.string().min(8).max(100).optional(),
});

export const propertyUploadSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
});

export const messageCreateSchema = z.object({
  leadId: emptyToNull(z.string().cuid()),
  channel: z.enum(messageChannels),
  content: z.string().min(1).max(4000),
});

export const leadCommunicationSchema = z
  .object({
    channel: z.enum(["EMAIL", "WHATSAPP"]),
    subject: emptyToUndefined(z.string().min(2).max(160)),
    body: z.string().trim().min(5).max(4000),
    templateKey: emptyToUndefined(z.string().min(2).max(80)),
  })
  .superRefine((value, ctx) => {
    if (value.channel === "EMAIL" && !value.subject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subject"],
        message: "Email subject is required.",
      });
    }
  });

export const aiAnalyzeSchema = z.object({
  query: z.string().min(2),
});

export const aiLeadScoreSchema = z.object({
  lead: z.object({
    fullName: z.string(),
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    source: z.string(),
    budget: z.number().optional().nullable(),
    location: z.string().optional().nullable(),
    propertyType: z.string().optional().nullable(),
    intent: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    status: z.string(),
  }),
});

export const aiSearchSchema = z.object({
  query: z.string().min(2),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  companyId: z.string().cuid().optional(),
});

export const aiChatSchema = z.object({
  message: z.string().min(2),
  companyId: emptyToUndefined(z.string().cuid()),
  leadId: emptyToUndefined(z.string().cuid()),
});

export const leadListQuerySchema = paginatedQuerySchema.extend({
  status: z.enum(leadStatuses).optional(),
  assignedToId: z.string().cuid().optional(),
});

export const propertyListQuerySchema = paginatedQuerySchema.extend({
  status: z.enum(propertyStatuses).optional(),
});

export const userListQuerySchema = paginatedQuerySchema.extend({
  role: z.enum(roles).optional(),
});
