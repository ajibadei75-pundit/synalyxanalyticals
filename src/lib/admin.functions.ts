import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  announcementSchema,
  assignmentSchema,
  brandingSchema,
  gradeSchema,
  notifySchema,
  reviewSchema,
  sessionSchema,
} from "@/lib/schemas";

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Forbidden");

    const [apps, profiles, courses, cohorts, sessions, assignments, submissions, attendance] =
      await Promise.all([
        supabase.from("applications").select("id, status, created_at, referral_source, course_id"),
        supabase.from("profiles").select("id, status, created_at"),
        supabase.from("courses").select("id, title, slug"),
        supabase.from("cohorts").select("id, name, course_id, start_date, status, capacity"),
        supabase.from("class_sessions").select("id, topic, starts_at, cohort_id"),
        supabase.from("assignments").select("id, title, due_at, cohort_id"),
        supabase.from("submissions").select("id, assignment_id, score, graded_at, submitted_at"),
        supabase.from("attendance").select("id, status, marked_at"),
      ]);

    return {
      applications: apps.data ?? [],
      profiles: profiles.data ?? [],
      courses: courses.data ?? [],
      cohorts: cohorts.data ?? [],
      sessions: sessions.data ?? [],
      assignments: assignments.data ?? [],
      submissions: submissions.data ?? [],
      attendance: attendance.data ?? [],
    };
  });

export const listApplicationsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listStudentsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Forbidden");

    const [profiles, roles, enrolments] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone, city, status, created_at"),
      supabase.from("user_roles").select("user_id, role"),
      supabase
        .from("enrollments")
        .select("id, student_id, status, cohort:cohorts(id, name, course:courses(title))"),
    ]);
    return {
      profiles: profiles.data ?? [],
      roles: roles.data ?? [],
      enrolments: enrolments.data ?? [],
    };
  });

export const listSubmissionsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Forbidden");

    const [submissions, assignments, profiles] = await Promise.all([
      supabase
        .from("submissions")
        .select("id, assignment_id, student_id, content, file_url, submitted_at, score, feedback, graded_at")
        .order("submitted_at", { ascending: false })
        .limit(300),
      supabase.from("assignments").select("id, title, max_score, cohort_id, submit_token, allowed_formats, max_file_mb, accepts_link, is_open, due_at"),
      supabase.from("profiles").select("id, full_name, email"),
    ]);
    return {
      submissions: submissions.data ?? [],
      assignments: assignments.data ?? [],
      profiles: profiles.data ?? [],
    };
  });

export const reviewApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => reviewSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: application, error: appErr } = await supabase
      .from("applications")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (appErr) throw new Error(appErr.message);
    if (!application) throw new Error("Application not found");

    if (data.action === "reject") {
      const { error } = await supabase
        .from("applications")
        .update({
          status: "rejected",
          review_note: data.note ?? null,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true as const, status: "rejected" as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const tempPassword = `Syn-${Math.random().toString(36).slice(2, 10)}${Math.floor(Math.random() * 90 + 10)}`;
    let studentId = application.student_id as string | null;

    if (!studentId) {
      const created = await supabaseAdmin.auth.admin.createUser({
        email: application.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: application.full_name, phone: application.phone },
      });
      if (created.error) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const existing = list?.users.find(
          (u) => u.email?.toLowerCase() === application.email.toLowerCase(),
        );
        if (!existing) throw new Error(created.error.message);
        studentId = existing.id;
      } else {
        studentId = created.data.user?.id ?? null;
      }
    }
    if (!studentId) throw new Error("Could not create the student account");

    await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: studentId,
          full_name: application.full_name,
          email: application.email,
          phone: application.phone,
          city: application.city,
        },
        { onConflict: "id" },
      );

    if (data.cohort_id) {
      await supabaseAdmin
        .from("enrollments")
        .insert({ student_id: studentId, cohort_id: data.cohort_id, status: "active" });
    }

    const { error: updErr } = await supabaseAdmin
      .from("applications")
      .update({
        status: "approved",
        review_note: data.note ?? null,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        student_id: studentId,
      })
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    await supabaseAdmin.from("notifications").insert({
      user_id: studentId,
      title: "Welcome to SYNALYX Analytics",
      body: "Your application was approved. Your portal is now active — check your schedule and assignments.",
      kind: "success",
      link: "/dashboard",
    });

    return {
      ok: true as const,
      status: "approved" as const,
      email: application.email,
      tempPassword: application.student_id ? null : tempPassword,
    };
  });

export const setStudentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "active" | "suspended" }) => ({
    id: String(data.id),
    status: data.status === "suspended" ? ("suspended" as const) : ("active" as const),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabase
      .from("profiles")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const updateBranding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => brandingSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    if (data.logo_url && !/^(data:image\/(png|jpeg|jpg|svg\+xml|webp);base64,|https:\/\/)/i.test(data.logo_url)) {
      throw new Error("Logo must be an uploaded image or an https URL.");
    }
    const { error } = await supabase
      .from("site_settings")
      .update({ brand_name: data.brand_name, tagline: data.tagline, logo_url: data.logo_url })
      .eq("singleton", true);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const createAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => announcementSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("announcements").insert({
      title: data.title,
      body: data.body,
      cohort_id: data.cohort_id,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const sendNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => notifySchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Forbidden");

    let recipients: string[] = [];
    if (data.audience === "user") {
      if (!data.user_id) throw new Error("Choose a recipient");
      recipients = [data.user_id];
    } else if (data.audience === "cohort") {
      if (!data.cohort_id) throw new Error("Choose a cohort");
      const { data: rows } = await supabase
        .from("enrollments")
        .select("student_id")
        .eq("cohort_id", data.cohort_id)
        .eq("status", "active");
      recipients = (rows ?? []).map((r) => r.student_id);
    } else {
      const { data: rows } = await supabase.from("profiles").select("id");
      recipients = (rows ?? []).map((r) => r.id);
    }
    if (!recipients.length) return { ok: true as const, sent: 0 };

    const { error } = await supabase.from("notifications").insert(
      recipients.map((id) => ({
        user_id: id,
        title: data.title,
        body: data.body,
        kind: "info",
        link: data.link ?? "/dashboard",
      })),
    );
    if (error) throw new Error(error.message);
    return { ok: true as const, sent: recipients.length };
  });

export const createAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => assignmentSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("assignments")
      .insert({
        cohort_id: data.cohort_id,
        title: data.title,
        brief: data.brief,
        due_at: data.due_at,
        max_score: data.max_score,
        allowed_formats: data.allowed_formats.map((f) => f.toLowerCase().replace(".", "")),
        max_file_mb: data.max_file_mb,
        accepts_link: data.accepts_link,
        resource_url: data.resource_url ?? null,
        created_by: context.userId,
      })
      .select("id, submit_token")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { ok: true as const, assignment: row };
  });

export const toggleAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; is_open: boolean }) => ({
    id: String(data.id),
    is_open: Boolean(data.is_open),
  }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("assignments")
      .update({ is_open: data.is_open })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const createSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => sessionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("class_sessions").insert({
      cohort_id: data.cohort_id,
      topic: data.topic,
      description: data.description ?? null,
      starts_at: data.starts_at,
      duration_minutes: data.duration_minutes,
      instructor: data.instructor ?? null,
      meeting_link: data.meeting_link ?? null,
      location: data.location ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const gradeSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => gradeSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("submissions")
      .update({
        score: data.score,
        feedback: data.feedback,
        graded_at: new Date().toISOString(),
        graded_by: userId,
      })
      .eq("id", data.submission_id)
      .select("student_id, assignment_id")
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (row) {
      await supabase.from("notifications").insert({
        user_id: row.student_id,
        title: "Your assignment has been graded",
        body: `You scored ${data.score}. Open your portal to read the feedback.`,
        kind: "success",
        link: "/dashboard",
      });
    }
    return { ok: true as const };
  });
