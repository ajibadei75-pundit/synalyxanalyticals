import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Bell, CheckCircle2, ImageUp, Loader2, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  createAnnouncement,
  createAssignment,
  createSession,
  getAdminOverview,
  gradeSubmission,
  listApplicationsAdmin,
  listStudentsAdmin,
  listSubmissionsAdmin,
  reviewApplication,
  sendNotification,
  setStudentStatus,
  toggleAssignment,
  updateBranding,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin console — SYNALYX Analytics" },
      {
        name: "description",
        content:
          "Manage applications, students, cohorts, sessions, grading and analytics at SYNALYX Analytics.",
      },
      { property: "og:title", content: "Admin console — SYNALYX Analytics" },
      { property: "og:description", content: "Applications, students, cohorts and analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

const CHART_COLORS = ["#6366f1", "#22d3ee", "#34d399", "#fbbf24", "#f472b6"];

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Admin() {
  const { user, loading, isStaff, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: settings } = useSiteSettings();

  const overviewFn = useServerFn(getAdminOverview);
  const appsFn = useServerFn(listApplicationsAdmin);
  const studentsFn = useServerFn(listStudentsAdmin);
  const subsFn = useServerFn(listSubmissionsAdmin);
  const reviewFn = useServerFn(reviewApplication);
  const statusFn = useServerFn(setStudentStatus);
  const brandingFn = useServerFn(updateBranding);
  const announceFn = useServerFn(createAnnouncement);
  const notifyFn = useServerFn(sendNotification);
  const assignmentFn = useServerFn(createAssignment);
  const toggleFn = useServerFn(toggleAssignment);
  const sessionFn = useServerFn(createSession);
  const gradeFn = useServerFn(gradeSubmission);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { portal: "admin" }, replace: true });
  }, [loading, user, navigate]);

  const enabled = !!user && isStaff;
  const overview = useQuery({ queryKey: ["admin-overview"], enabled, queryFn: () => overviewFn() });
  const apps = useQuery({ queryKey: ["admin-apps"], enabled, queryFn: () => appsFn() });
  const students = useQuery({ queryKey: ["admin-students"], enabled, queryFn: () => studentsFn() });
  const subs = useQuery({ queryKey: ["admin-subs"], enabled, queryFn: () => subsFn() });

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-apps"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-subs"] });
  };

  const review = useMutation({
    mutationFn: (vars: { id: string; action: "approve" | "reject"; cohort_id?: string }) =>
      reviewFn({ data: vars }),
    onSuccess: (res) => {
      if (res.status === "approved" && res.tempPassword) {
        toast.success(`Approved — temporary password: ${res.tempPassword}`, { duration: 20000 });
      } else {
        toast.success(`Application ${res.status}`);
      }
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const charts = useMemo(() => {
    const d = overview.data;
    if (!d) return null;
    const byStatus = ["pending", "approved", "rejected"].map((s) => ({
      name: s,
      value: d.applications.filter((a) => a.status === s).length,
    }));
    const perCourse = d.courses.map((c) => ({
      name: c.title.split(" ")[0] ?? c.title,
      applications: d.applications.filter((a) => a.course_id === c.id).length,
    }));
    const referrals = Object.entries(
      d.applications.reduce<Record<string, number>>((acc, a) => {
        const key = a.referral_source || "unknown";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value }));
    const present = d.attendance.filter((a) => a.status === "present" || a.status === "late").length;
    return {
      byStatus,
      perCourse,
      referrals,
      attendanceRate: d.attendance.length ? Math.round((present / d.attendance.length) * 100) : 0,
      gradedRate: d.submissions.length
        ? Math.round((d.submissions.filter((s) => s.graded_at).length / d.submissions.length) * 100)
        : 0,
    };
  }, [overview.data]);

  if (loading || !user) return null;

  if (!isStaff) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-3xl px-5 py-24 text-center">
          <h1 className="font-display text-3xl font-bold uppercase">Restricted area</h1>
          <p className="mt-4 text-muted-foreground">
            Your account doesn't have staff access to the admin console.
          </p>
        </section>
      </SiteLayout>
    );
  }

  const cohorts = overview.data?.cohorts ?? [];

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.35em] text-primary-glow">
              Administration
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight">
              Control centre
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin-content">Content studio</Link>
            </Button>
            <Badge variant="outline" className="h-8 px-3">
              <Users className="mr-2 h-3.5 w-3.5" />
              {overview.data?.profiles.length ?? 0} people
            </Badge>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Pending applications"
            value={String(apps.data?.filter((a) => a.status === "pending").length ?? 0)}
          />
          <Kpi label="Active cohorts" value={String(cohorts.filter((c) => c.status === "open").length)} />
          <Kpi label="Attendance rate" value={`${charts?.attendanceRate ?? 0}%`} />
          <Kpi label="Graded submissions" value={`${charts?.gradedRate ?? 0}%`} />
        </div>

        <Tabs defaultValue="analytics" className="mt-10">
          <TabsList className="flex-wrap">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="grading">Grading</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="notify">Notifications</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
          </TabsList>

          {/* ANALYTICS */}
          <TabsContent value="analytics" className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="font-display text-sm uppercase tracking-widest">Applications by status</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={charts?.byStatus ?? []} dataKey="value" nameKey="name" outerRadius={90}>
                      {(charts?.byStatus ?? []).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="font-display text-sm uppercase tracking-widest">Applications per course</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.perCourse ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="applications" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
              <p className="font-display text-sm uppercase tracking-widest">Referral sources</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.referrals ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* APPLICATIONS */}
          <TabsContent value="applications" className="mt-6 space-y-4">
            {(apps.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            )}
            {(apps.data ?? []).map((a) => (
              <ApplicationCard
                key={a.id}
                app={a}
                cohorts={cohorts}
                canReview={isAdmin}
                busy={review.isPending}
                onReview={(action, cohort_id) =>
                  review.mutate(cohort_id ? { id: a.id, action, cohort_id } : { id: a.id, action })
                }
              />
            ))}
          </TabsContent>

          {/* STUDENTS */}
          <TabsContent value="students" className="mt-6">
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-background/50 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Cohort</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(students.data?.profiles ?? []).map((p) => {
                    const enrol = students.data?.enrolments.find((e) => e.student_id === p.id);
                    return (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-medium">{p.full_name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {enrol?.cohort?.name ?? "Unassigned"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={p.status === "active" ? "default" : "destructive"}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await statusFn({
                                  data: {
                                    id: p.id,
                                    status: p.status === "active" ? "suspended" : "active",
                                  },
                                });
                                toast.success("Access updated");
                                refreshAll();
                              }}
                            >
                              {p.status === "active" ? "Suspend" : "Reactivate"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ASSIGNMENTS */}
          <TabsContent value="assignments" className="mt-6 grid gap-5 lg:grid-cols-2">
            <AssignmentForm
              cohorts={cohorts}
              onCreate={async (payload) => {
                await assignmentFn({ data: payload });
                toast.success("Assignment created with its own submission link");
                refreshAll();
              }}
            />
            <div className="space-y-3">
              {(subs.data?.assignments ?? []).map((a) => (
                <div key={a.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {(a.allowed_formats ?? []).join(", ").toUpperCase()} · max {a.max_file_mb}MB ·
                        due {new Date(a.due_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={a.is_open ? "default" : "secondary"}>
                      {a.is_open ? "Open" : "Closed"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void navigator.clipboard.writeText(
                          `${window.location.origin}/submit/${a.submit_token}`,
                        );
                        toast.success("Submission link copied");
                      }}
                    >
                      Copy submission link
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await toggleFn({ data: { id: a.id, is_open: !a.is_open } });
                        toast.success(a.is_open ? "Submissions closed" : "Submissions opened");
                        refreshAll();
                      }}
                    >
                      {a.is_open ? "Close submissions" : "Reopen"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* GRADING */}
          <TabsContent value="grading" className="mt-6 space-y-4">
            {(subs.data?.submissions ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            )}
            {(subs.data?.submissions ?? []).map((s) => {
              const assignment = subs.data?.assignments.find((a) => a.id === s.assignment_id);
              const student = subs.data?.profiles.find((p) => p.id === s.student_id);
              return (
                <GradeCard
                  key={s.id}
                  submission={s}
                  assignmentTitle={assignment?.title ?? "Assignment"}
                  maxScore={assignment?.max_score ?? 100}
                  studentName={student?.full_name || student?.email || "Student"}
                  onGrade={async (score, feedback) => {
                    await gradeFn({ data: { submission_id: s.id, score, feedback } });
                    toast.success("Graded and student notified");
                    refreshAll();
                  }}
                />
              );
            })}
          </TabsContent>

          {/* SESSIONS */}
          <TabsContent value="sessions" className="mt-6 grid gap-5 lg:grid-cols-2">
            <SessionForm
              cohorts={cohorts}
              onCreate={async (payload) => {
                await sessionFn({ data: payload });
                toast.success("Class scheduled");
                refreshAll();
              }}
            />
            <div className="space-y-3">
              {(overview.data?.sessions ?? []).map((s) => (
                <div key={s.id} className="rounded-2xl border border-border bg-card p-4">
                  <p className="font-semibold">{s.topic}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.starts_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* NOTIFICATIONS */}
          <TabsContent value="notify" className="mt-6 grid gap-5 lg:grid-cols-2">
            <NotifyForm
              cohorts={cohorts}
              onSend={async (payload) => {
                const res = await notifyFn({ data: payload });
                toast.success(`Notification sent to ${res.sent} ${res.sent === 1 ? "person" : "people"}`);
              }}
            />
            <AnnouncementForm
              cohorts={cohorts}
              onPost={async (payload) => {
                await announceFn({ data: payload });
                toast.success("Announcement posted — students notified");
              }}
            />
          </TabsContent>

          {/* BRANDING */}
          <TabsContent value="branding" className="mt-6 max-w-xl">
            <BrandingForm
              initial={{
                brand_name: settings?.brand_name ?? "SYNALYX",
                tagline: settings?.tagline ?? "",
                logo_url: settings?.logo_url ?? null,
              }}
              disabled={!isAdmin}
              onSave={async (payload) => {
                await brandingFn({ data: payload });
                toast.success("Branding updated");
                void queryClient.invalidateQueries({ queryKey: ["site-settings"] });
              }}
            />
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}

type Cohort = { id: string; name: string; status: string };

function ApplicationCard({
  app,
  cohorts,
  canReview,
  busy,
  onReview,
}: {
  app: Record<string, unknown> & { id: string; status: string };
  cohorts: Cohort[];
  canReview: boolean;
  busy: boolean;
  onReview: (action: "approve" | "reject", cohortId?: string) => void;
}) {
  const [cohortId, setCohortId] = useState("");
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold">{String(app["full_name"])}</p>
          <p className="text-xs text-muted-foreground">
            {String(app["email"])} · {String(app["phone"])} · {String(app["city"] ?? "")}
          </p>
        </div>
        <Badge
          variant={
            app.status === "approved" ? "default" : app.status === "rejected" ? "destructive" : "secondary"
          }
        >
          {app.status}
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{String(app["goals"] ?? "")}</p>
      {app.status === "pending" && canReview && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={cohortId}
            onChange={(e) => setCohortId(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Place in cohort (optional)</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button size="sm" disabled={busy} onClick={() => onReview("approve", cohortId || undefined)}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Approve & create account
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onReview("reject")}>
            <XCircle className="mr-2 h-4 w-4" /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}

function AssignmentForm({
  cohorts,
  onCreate,
}: {
  cohorts: Cohort[];
  onCreate: (p: {
    cohort_id: string;
    title: string;
    brief: string;
    due_at: string;
    max_score: number;
    allowed_formats: string[];
    max_file_mb: number;
    accepts_link: boolean;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    cohort_id: "",
    title: "",
    brief: "",
    due_at: "",
    max_score: 100,
    formats: "pdf, xlsx, csv",
    max_file_mb: 15,
    accepts_link: true,
  });
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4 rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onCreate({
            cohort_id: form.cohort_id,
            title: form.title,
            brief: form.brief,
            due_at: new Date(form.due_at).toISOString(),
            max_score: Number(form.max_score),
            allowed_formats: form.formats
              .split(",")
              .map((f) => f.trim().replace(".", "").toLowerCase())
              .filter(Boolean),
            max_file_mb: Number(form.max_file_mb),
            accepts_link: form.accepts_link,
          });
          setForm({ ...form, title: "", brief: "", due_at: "" });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not create assignment");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="font-display text-sm uppercase tracking-widest">New assignment</p>
      <select
        required
        value={form.cohort_id}
        onChange={(e) => setForm({ ...form, cohort_id: e.target.value })}
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
      >
        <option value="">Select cohort</option>
        {cohorts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Input
        placeholder="Title"
        required
        maxLength={160}
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <Textarea
        placeholder="Brief"
        rows={4}
        maxLength={4000}
        value={form.brief}
        onChange={(e) => setForm({ ...form, brief: e.target.value })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs">Due</Label>
          <Input
            type="datetime-local"
            required
            value={form.due_at}
            onChange={(e) => setForm({ ...form, due_at: e.target.value })}
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Max score</Label>
          <Input
            type="number"
            min={1}
            max={1000}
            value={form.max_score}
            onChange={(e) => setForm({ ...form, max_score: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Accepted formats</Label>
          <Input
            value={form.formats}
            onChange={(e) => setForm({ ...form, formats: e.target.value })}
            placeholder="pdf, xlsx, csv"
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Max file size (MB)</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={form.max_file_mb}
            onChange={(e) => setForm({ ...form, max_file_mb: Number(e.target.value) })}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={form.accepts_link}
          onChange={(e) => setForm({ ...form, accepts_link: e.target.checked })}
        />
        Also accept a secure https link
      </label>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create assignment
      </Button>
    </form>
  );
}

function SessionForm({
  cohorts,
  onCreate,
}: {
  cohorts: Cohort[];
  onCreate: (p: {
    cohort_id: string;
    topic: string;
    starts_at: string;
    duration_minutes: number;
    instructor?: string;
    meeting_link?: string;
    location?: string;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    cohort_id: "",
    topic: "",
    starts_at: "",
    duration_minutes: 120,
    instructor: "",
    meeting_link: "",
    location: "",
  });
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4 rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onCreate({
            cohort_id: form.cohort_id,
            topic: form.topic,
            starts_at: new Date(form.starts_at).toISOString(),
            duration_minutes: Number(form.duration_minutes),
            instructor: form.instructor,
            meeting_link: form.meeting_link,
            location: form.location,
          });
          setForm({ ...form, topic: "", starts_at: "" });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not schedule class");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="font-display text-sm uppercase tracking-widest">Schedule a class</p>
      <select
        required
        value={form.cohort_id}
        onChange={(e) => setForm({ ...form, cohort_id: e.target.value })}
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
      >
        <option value="">Select cohort</option>
        {cohorts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Input
        placeholder="Topic"
        required
        value={form.topic}
        onChange={(e) => setForm({ ...form, topic: e.target.value })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          type="datetime-local"
          required
          value={form.starts_at}
          onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
        />
        <Input
          type="number"
          min={15}
          max={600}
          value={form.duration_minutes}
          onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
        />
        <Input
          placeholder="Instructor"
          value={form.instructor}
          onChange={(e) => setForm({ ...form, instructor: e.target.value })}
        />
        <Input
          placeholder="Meeting link"
          value={form.meeting_link}
          onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
        />
      </div>
      <Input
        placeholder="Location (optional)"
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
      />
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Schedule class
      </Button>
    </form>
  );
}

function GradeCard({
  submission,
  assignmentTitle,
  studentName,
  maxScore,
  onGrade,
}: {
  submission: {
    id: string;
    content: string;
    file_url: string | null;
    submitted_at: string;
    score: number | null;
    graded_at: string | null;
  };
  assignmentTitle: string;
  studentName: string;
  maxScore: number;
  onGrade: (score: number, feedback: string) => Promise<void>;
}) {
  const [score, setScore] = useState(submission.score ?? 0);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{studentName}</p>
          <p className="text-xs text-muted-foreground">
            {assignmentTitle} · submitted {new Date(submission.submitted_at).toLocaleString()}
          </p>
        </div>
        <Badge variant={submission.graded_at ? "default" : "secondary"}>
          {submission.graded_at ? `${submission.score}/${maxScore}` : "Awaiting grade"}
        </Badge>
      </div>
      {submission.content && (
        <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{submission.content}</p>
      )}
      {submission.file_url && (
        <p className="mt-2 text-xs text-muted-foreground">Attachment: {submission.file_url}</p>
      )}
      {!submission.graded_at && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Input
            type="number"
            min={0}
            max={maxScore}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-24"
          />
          <Input
            placeholder="Feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="flex-1 min-w-48"
          />
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onGrade(score, feedback);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not grade");
              } finally {
                setBusy(false);
              }
            }}
          >
            Save grade
          </Button>
        </div>
      )}
    </div>
  );
}

function NotifyForm({
  cohorts,
  onSend,
}: {
  cohorts: Cohort[];
  onSend: (p: {
    audience: "all" | "cohort";
    cohort_id?: string;
    title: string;
    body: string;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({ audience: "all", cohort_id: "", title: "", body: "" });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4 rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSend({
            audience: form.audience as "all" | "cohort",
            ...(form.audience === "cohort" ? { cohort_id: form.cohort_id } : {}),
            title: form.title,
            body: form.body,
          });
          setForm({ ...form, title: "", body: "" });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not send");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="flex items-center gap-2 font-display text-sm uppercase tracking-widest">
        <Bell className="h-4 w-4 text-primary-glow" /> Push a notification
      </p>
      <select
        value={form.audience}
        onChange={(e) => setForm({ ...form, audience: e.target.value })}
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
      >
        <option value="all">Everyone</option>
        <option value="cohort">A cohort</option>
      </select>
      {form.audience === "cohort" && (
        <select
          required
          value={form.cohort_id}
          onChange={(e) => setForm({ ...form, cohort_id: e.target.value })}
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">Select cohort</option>
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      <Input
        placeholder="Title"
        required
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <Textarea
        placeholder="Message"
        rows={3}
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
      />
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send notification
      </Button>
    </form>
  );
}

function AnnouncementForm({
  cohorts,
  onPost,
}: {
  cohorts: Cohort[];
  onPost: (p: { title: string; body: string; cohort_id: string | null }) => Promise<void>;
}) {
  const [form, setForm] = useState({ title: "", body: "", cohort_id: "" });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4 rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onPost({ title: form.title, body: form.body, cohort_id: form.cohort_id || null });
          setForm({ title: "", body: "", cohort_id: "" });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not post");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="font-display text-sm uppercase tracking-widest">Post an announcement</p>
      <select
        value={form.cohort_id}
        onChange={(e) => setForm({ ...form, cohort_id: e.target.value })}
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
      >
        <option value="">Whole school</option>
        {cohorts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Input
        placeholder="Title"
        required
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <Textarea
        placeholder="Body"
        rows={4}
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
      />
      <Button type="submit" variant="outline" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Post announcement
      </Button>
    </form>
  );
}

function BrandingForm({
  initial,
  disabled,
  onSave,
}: {
  initial: { brand_name: string; tagline: string; logo_url: string | null };
  disabled: boolean;
  onSave: (p: { brand_name: string; tagline: string; logo_url: string | null }) => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => setForm(initial), [initial.brand_name, initial.tagline, initial.logo_url]);

  const onFile = (file: File | null) => {
    if (!file) return;
    if (file.size > 250 * 1024) {
      toast.error("Logo must be under 250KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logo_url: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  return (
    <form
      className="space-y-4 rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave(form);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not save");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="flex items-center gap-2 font-display text-sm uppercase tracking-widest">
        <ImageUp className="h-4 w-4 text-primary-glow" /> Brand & logo
      </p>
      {form.logo_url && (
        <img
          src={form.logo_url}
          alt="Current logo"
          className="h-16 w-16 rounded-lg border border-border object-contain"
        />
      )}
      <div>
        <Label className="mb-1.5 block text-xs">Upload logo (PNG/SVG, under 250KB)</Label>
        <Input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          disabled={disabled}
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <Input
        value={form.brand_name}
        disabled={disabled}
        onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
        placeholder="Brand name"
      />
      <Input
        value={form.tagline}
        disabled={disabled}
        onChange={(e) => setForm({ ...form, tagline: e.target.value })}
        placeholder="Tagline"
      />
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={busy || disabled}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save branding
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={disabled}
          onClick={() => setForm({ ...form, logo_url: null })}
        >
          Reset logo
        </Button>
      </div>
      {disabled && (
        <p className="text-xs text-muted-foreground">Only administrators can change branding.</p>
      )}
    </form>
  );
}
