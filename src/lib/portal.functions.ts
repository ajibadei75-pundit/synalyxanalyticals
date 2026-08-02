import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { submitSchema, extensionOf } from "@/lib/schemas";

export const getMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("id, title, body, kind, link, read_at, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { ids?: string[] }) => ({ ids: data?.ids ?? [] }))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .is("read_at", null);
    if (data.ids.length) q = q.in("id", data.ids);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const getMyPortal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [profileRes, enrolRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("enrollments")
        .select("id, status, cohort:cohorts(id, name, start_date, mode, schedule, course:courses(title, slug))")
        .eq("student_id", userId)
        .eq("status", "active"),
    ]);

    const enrolments = enrolRes.data ?? [];
    const cohortIds = enrolments.map((e) => e.cohort?.id).filter(Boolean) as string[];

    if (!cohortIds.length) {
      return {
        profile: profileRes.data,
        enrolments,
        sessions: [],
        assignments: [],
        submissions: [],
        attendance: [],
      };
    }

    const [sessionsRes, assignmentsRes, submissionsRes, attendanceRes] = await Promise.all([
      supabase
        .from("class_sessions")
        .select("id, topic, description, starts_at, duration_minutes, instructor, meeting_link, location, cohort_id")
        .in("cohort_id", cohortIds)
        .order("starts_at", { ascending: true }),
      supabase
        .from("assignments")
        .select("id, title, brief, due_at, max_score, resource_url, submit_token, allowed_formats, max_file_mb, accepts_link, is_open, cohort_id")
        .in("cohort_id", cohortIds)
        .order("due_at", { ascending: true }),
      supabase
        .from("submissions")
        .select("id, assignment_id, content, file_url, submitted_at, score, feedback, graded_at")
        .eq("student_id", userId),
      supabase
        .from("attendance")
        .select("id, session_id, status, marked_at")
        .eq("student_id", userId),
    ]);

    return {
      profile: profileRes.data,
      enrolments,
      sessions: sessionsRes.data ?? [],
      assignments: assignmentsRes.data ?? [],
      submissions: submissionsRes.data ?? [],
      attendance: attendanceRes.data ?? [],
    };
  });

export const getAssignmentByToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { token: string }) => ({ token: String(data.token).slice(0, 64) }))
  .handler(async ({ data, context }) => {
    const { data: assignment, error } = await context.supabase
      .from("assignments")
      .select("id, title, brief, due_at, max_score, resource_url, allowed_formats, max_file_mb, accepts_link, is_open, cohort_id")
      .eq("submit_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!assignment) return { assignment: null, submission: null };

    const { data: submission } = await context.supabase
      .from("submissions")
      .select("id, content, file_url, submitted_at, score, feedback, graded_at")
      .eq("assignment_id", assignment.id)
      .eq("student_id", context.userId)
      .maybeSingle();

    return { assignment, submission: submission ?? null };
  });

export const submitAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: assignment, error: aErr } = await supabase
      .from("assignments")
      .select("id, title, allowed_formats, accepts_link, is_open, created_by")
      .eq("id", data.assignment_id)
      .maybeSingle();
    if (aErr) throw new Error(aErr.message);
    if (!assignment) throw new Error("Assignment not found or not available to you.");
    if (!assignment.is_open) throw new Error("Submissions are closed for this assignment.");

    if (data.file_url) {
      const ext = extensionOf(data.file_url);
      const allowed = (assignment.allowed_formats ?? []).map((f) => f.toLowerCase().replace(".", ""));
      if (!allowed.includes(ext)) {
        throw new Error(`Only ${allowed.join(", ").toUpperCase()} files are accepted.`);
      }
      if (/^https?:\/\//i.test(data.file_url) && !assignment.accepts_link) {
        throw new Error("External links are not accepted for this assignment.");
      }
    }
    if (!data.file_url && !data.content) {
      throw new Error("Add your answer or attach a file before submitting.");
    }

    const { data: existing } = await supabase
      .from("submissions")
      .select("id, graded_at")
      .eq("assignment_id", data.assignment_id)
      .eq("student_id", userId)
      .maybeSingle();

    if (existing) {
      if (existing.graded_at) throw new Error("This submission has already been graded.");
      const { error } = await supabase
        .from("submissions")
        .update({
          content: data.content,
          file_url: data.file_url,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("submissions").insert({
        assignment_id: data.assignment_id,
        student_id: userId,
        content: data.content,
        file_url: data.file_url,
      });
      if (error) throw new Error(error.message);
    }

    return { ok: true as const };
  });
