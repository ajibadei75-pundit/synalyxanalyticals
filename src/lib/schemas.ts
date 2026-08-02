import { z } from "zod";

export const brandingSchema = z.object({
  brand_name: z.string().trim().min(1).max(60),
  tagline: z.string().trim().max(160),
  logo_url: z.string().trim().max(400_000).nullable(),
});

export const reviewSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(1000).optional(),
  cohort_id: z.string().uuid().optional(),
});

export const notifySchema = z.object({
  audience: z.enum(["all", "cohort", "user"]),
  cohort_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().max(1000).default(""),
  link: z.string().trim().max(300).optional(),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().max(2000).default(""),
  cohort_id: z.string().uuid().nullable(),
});

export const assignmentSchema = z.object({
  cohort_id: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  brief: z.string().trim().max(4000).default(""),
  due_at: z.string().min(4).max(40),
  max_score: z.number().int().min(1).max(1000),
  allowed_formats: z.array(z.string().trim().min(1).max(10)).min(1).max(12),
  max_file_mb: z.number().int().min(1).max(100),
  accepts_link: z.boolean(),
  resource_url: z.string().trim().max(500).nullable().optional(),
});

export const sessionSchema = z.object({
  cohort_id: z.string().uuid(),
  topic: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional(),
  starts_at: z.string().min(4).max(40),
  duration_minutes: z.number().int().min(15).max(600),
  instructor: z.string().trim().max(120).optional(),
  meeting_link: z.string().trim().max(500).optional(),
  location: z.string().trim().max(200).optional(),
});

export const gradeSchema = z.object({
  submission_id: z.string().uuid(),
  score: z.number().int().min(0).max(1000),
  feedback: z.string().trim().max(2000).default(""),
});

export const submitSchema = z.object({
  assignment_id: z.string().uuid(),
  content: z.string().trim().max(4000).default(""),
  file_url: z.string().trim().max(600).nullable(),
});

export function extensionOf(value: string): string {
  const clean = value.split("?")[0] ?? value;
  const dot = clean.lastIndexOf(".");
  return dot === -1 ? "" : clean.slice(dot + 1).toLowerCase();
}
