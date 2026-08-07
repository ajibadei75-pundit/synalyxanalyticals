import { z } from "zod";

const httpsUrl = z
  .string()
  .trim()
  .url("Enter a valid https link")
  .max(600)
  .refine((v) => /^https:\/\//i.test(v), "Links must start with https://");

export const mediaSchema = z.object({
  title: z.string().trim().min(2, "Add a title").max(140),
  description: z.string().trim().max(600).default(""),
  media_type: z.enum(["image", "video"]),
  url: httpsUrl.or(z.string().trim().regex(/^media\//, "Upload failed")),
  storage_path: z.string().trim().max(400).nullable().default(null),
  event_date: z.string().trim().max(20).nullable().default(null),
  is_published: z.boolean().default(true),
});

export const merchSchema = z.object({
  name: z.string().trim().min(2, "Add a product name").max(140),
  description: z.string().trim().max(800).default(""),
  price: z.number().min(0).max(10_000_000).nullable().default(null),
  currency: z.string().trim().min(1).max(6).default("NGN"),
  image_url: z.string().trim().max(600).nullable().default(null),
  preorder_url: httpsUrl,
  available_until: z.string().trim().max(20).nullable().default(null),
  is_published: z.boolean().default(true),
});

export const projectSchema = z.object({
  title: z.string().trim().min(2, "Add a project title").max(160),
  summary: z.string().trim().max(1200).default(""),
  author_name: z.string().trim().max(120).nullable().default(null),
  tools: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  image_url: z.string().trim().max(600).nullable().default(null),
  project_url: httpsUrl.nullable().or(z.literal("")).default(""),
  is_published: z.boolean().default(true),
});

export type MediaInput = z.infer<typeof mediaSchema>;
export type MerchInput = z.infer<typeof merchSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
