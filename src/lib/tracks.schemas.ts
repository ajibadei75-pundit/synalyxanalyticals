import { z } from "zod";

export const trackSchema = z.object({
  id: z.string().uuid().nullable().default(null),
  title: z.string().trim().min(3, "Add a track title").max(140),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by dashes"),
  summary: z.string().trim().min(10, "Add a short summary").max(400),
  description: z.string().trim().max(2000).default(""),
  level: z.string().trim().min(2).max(40).default("Beginner"),
  duration_weeks: z.number().int().min(1).max(104).default(8),
  fee: z.number().min(0).max(100_000_000).default(0),
  outline: z.array(z.string().trim().min(2).max(200)).max(40).default([]),
  sort_order: z.number().int().min(0).max(999).default(0),
  is_active: z.boolean().default(true),
});

export type TrackInput = z.infer<typeof trackSchema>;
