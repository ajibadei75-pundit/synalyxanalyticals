import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function serverPublicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listCourses = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title, summary, description, level, duration_weeks, fee, outline")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listOpenCohorts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("cohorts")
    .select("id, name, start_date, mode, schedule, course_id, status")
    .eq("status", "open")
    .order("start_date", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const applicationSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30),
  date_of_birth: z.string().trim().max(20).optional().or(z.literal("")),
  gender: z.string().trim().max(30).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  education: z.string().trim().max(120).optional().or(z.literal("")),
  occupation: z.string().trim().max(120).optional().or(z.literal("")),
  experience_level: z.string().trim().max(60).optional().or(z.literal("")),
  has_computer: z.boolean(),
  course_id: z.string().uuid("Choose a course"),
  preferred_start: z.string().trim().max(20).optional().or(z.literal("")),
  preferred_schedule: z.string().trim().max(40).optional().or(z.literal("")),
  learning_mode: z.string().trim().max(40).optional().or(z.literal("")),
  goals: z.string().trim().min(10, "Tell us what you want to achieve").max(2000),
  referral_source: z.string().trim().max(60).optional().or(z.literal("")),
  questions: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => applicationSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = serverPublicClient();
    const row = {
      ...data,
      date_of_birth: data.date_of_birth || null,
      preferred_start: data.preferred_start || null,
      gender: data.gender || null,
      city: data.city || null,
      education: data.education || null,
      occupation: data.occupation || null,
      experience_level: data.experience_level || null,
      preferred_schedule: data.preferred_schedule || null,
      learning_mode: data.learning_mode || null,
      referral_source: data.referral_source || null,
      questions: data.questions || null,
      status: "pending" as const,
    };
    const { error } = await supabase.from("applications").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
