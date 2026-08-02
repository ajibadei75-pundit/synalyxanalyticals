import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LinkIcon,
  Percent,
  Video,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth/AuthProvider";
import { getMyPortal } from "@/lib/portal.functions";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Student portal — SYNALYX Analytics" },
      {
        name: "description",
        content: "Your cohort schedule, assignments, attendance and grades at SYNALYX Analytics.",
      },
      { property: "og:title", content: "Student portal — SYNALYX Analytics" },
      { property: "og:description", content: "Schedule, assignments, attendance and grades." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function fmt(dt: string) {
  return new Date(dt).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className={`inline-flex rounded-xl p-2.5 ${tone}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="mt-4 font-display text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function Dashboard() {
  const { user, loading, signOut, isStaff } = useAuth();
  const navigate = useNavigate();
  const fetchPortal = useServerFn(getMyPortal);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const { data } = useQuery({
    queryKey: ["my-portal", user?.id],
    enabled: !!user,
    queryFn: () => fetchPortal(),
  });

  const stats = useMemo(() => {
    const assignments = data?.assignments ?? [];
    const submissions = data?.submissions ?? [];
    const attendance = data?.attendance ?? [];
    const present = attendance.filter((a) => a.status === "present" || a.status === "late").length;
    const graded = submissions.filter((s) => s.graded_at);
    const avg = graded.length
      ? Math.round(graded.reduce((t, s) => t + (s.score ?? 0), 0) / graded.length)
      : null;
    const upcoming = (data?.sessions ?? []).filter((s) => new Date(s.starts_at) > new Date());
    return {
      submittedRate: assignments.length
        ? Math.round((submissions.length / assignments.length) * 100)
        : 0,
      attendanceRate: attendance.length ? Math.round((present / attendance.length) * 100) : 0,
      avg,
      upcoming,
      assignments,
      submissions,
    };
  }, [data]);

  if (loading || !user) return null;

  const nextSession = stats.upcoming[0];
  const submissionFor = (id: string) => stats.submissions.find((s) => s.assignment_id === id);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.35em] text-primary-glow">
              Student portal
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight">
              Welcome back
              {data?.profile?.full_name ? `, ${data.profile.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {data?.enrolments?.length
                ? data.enrolments
                    .map((e) => `${e.cohort?.course?.title ?? "Course"} · ${e.cohort?.name ?? ""}`)
                    .join(" | ")
                : "You are not in an active cohort yet — an admin will place you shortly."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isStaff && (
              <Button asChild variant="outline">
                <Link to="/admin">Admin console</Link>
              </Button>
            )}
            <Button variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={CalendarDays}
            label="Upcoming classes"
            value={String(stats.upcoming.length)}
            tone="bg-primary/15 text-primary-glow"
          />
          <StatCard
            icon={ClipboardList}
            label="Assignments submitted"
            value={`${stats.submittedRate}%`}
            tone="bg-sky-500/15 text-sky-300"
          />
          <StatCard
            icon={Percent}
            label="Attendance"
            value={`${stats.attendanceRate}%`}
            tone="bg-emerald-500/15 text-emerald-300"
          />
          <StatCard
            icon={GraduationCap}
            label="Average score"
            value={stats.avg === null ? "—" : String(stats.avg)}
            tone="bg-amber-500/15 text-amber-300"
          />
        </div>

        {nextSession && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/40 bg-primary/10 p-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-glow">Next class</p>
              <p className="mt-2 font-display text-xl font-bold">{nextSession.topic}</p>
              <p className="text-sm text-muted-foreground">
                {fmt(nextSession.starts_at)} · {nextSession.duration_minutes} mins
                {nextSession.instructor ? ` · ${nextSession.instructor}` : ""}
              </p>
            </div>
            {nextSession.meeting_link && (
              <Button asChild>
                <a href={nextSession.meeting_link} target="_blank" rel="noreferrer noopener">
                  <Video className="mr-2 h-4 w-4" /> Join class
                </a>
              </Button>
            )}
          </div>
        )}

        <Tabs defaultValue="assignments" className="mt-10">
          <TabsList>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="mt-6 space-y-4">
            {stats.assignments.length === 0 && (
              <p className="text-sm text-muted-foreground">No assignments yet.</p>
            )}
            {stats.assignments.map((a) => {
              const sub = submissionFor(a.id);
              const link = `${typeof window !== "undefined" ? window.location.origin : ""}/submit/${a.submit_token}`;
              return (
                <div key={a.id} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-bold">{a.title}</h3>
                      <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                        Due {fmt(a.due_at)} · {a.max_score} marks
                      </p>
                    </div>
                    <Badge variant={sub?.graded_at ? "default" : sub ? "secondary" : "outline"}>
                      {sub?.graded_at ? `Graded ${sub.score}/${a.max_score}` : sub ? "Submitted" : "Pending"}
                    </Badge>
                  </div>
                  {a.brief && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a.brief}</p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Accepted formats:{" "}
                    <span className="font-semibold text-foreground">
                      {(a.allowed_formats ?? []).join(", ").toUpperCase()}
                    </span>{" "}
                    · max {a.max_file_mb}MB
                  </p>
                  {sub?.feedback && (
                    <p className="mt-3 rounded-xl border border-border bg-background/60 p-3 text-sm">
                      <span className="font-semibold">Feedback: </span>
                      {sub.feedback}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button asChild size="sm">
                      <Link to="/submit/$token" params={{ token: a.submit_token }}>
                        {sub ? "Update submission" : "Submit work"}
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void navigator.clipboard.writeText(link);
                        setCopied(a.id);
                        setTimeout(() => setCopied(null), 1500);
                      }}
                    >
                      <LinkIcon className="mr-2 h-3.5 w-3.5" />
                      {copied === a.id ? "Link copied" : "Copy submission link"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="schedule" className="mt-6 space-y-3">
            {(data?.sessions ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No sessions scheduled yet.</p>
            )}
            {(data?.sessions ?? []).map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5"
              >
                <div>
                  <p className="font-semibold">{s.topic}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt(s.starts_at)} · {s.duration_minutes} mins
                    {s.location ? ` · ${s.location}` : ""}
                  </p>
                </div>
                {s.meeting_link && (
                  <Button asChild size="sm" variant="outline">
                    <a href={s.meeting_link} target="_blank" rel="noreferrer noopener">
                      Join
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="attendance" className="mt-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Overall attendance
              </p>
              <p className="mt-2 font-display text-4xl font-bold">{stats.attendanceRate}%</p>
              <Progress value={stats.attendanceRate} className="mt-4" />
              <ul className="mt-6 divide-y divide-border text-sm">
                {(data?.attendance ?? []).map((a) => {
                  const session = (data?.sessions ?? []).find((s) => s.id === a.session_id);
                  return (
                    <li key={a.id} className="flex items-center justify-between py-3">
                      <span>{session?.topic ?? "Session"}</span>
                      <Badge
                        variant={
                          a.status === "present"
                            ? "default"
                            : a.status === "absent"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {a.status}
                      </Badge>
                    </li>
                  );
                })}
                {(data?.attendance ?? []).length === 0 && (
                  <li className="py-3 text-muted-foreground">No attendance recorded yet.</li>
                )}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}
