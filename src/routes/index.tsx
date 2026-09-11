import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Binary,
  CalendarCheck,
  ClipboardList,
  Database,
  Gauge,
  LineChart,
  PieChart,
  ScatterChart,
  Sparkles,
  Table2,
  TrendingUp,
  Users,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal, Counter } from "@/components/site/Reveal";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { listCourses } from "@/lib/public.functions";
import { ExploreSection } from "@/components/site/ExploreSection";
import { NewsTicker } from "@/components/site/NewsTicker";

const coursesQuery = queryOptions({
  queryKey: ["public", "courses"],
  queryFn: async () => {
    try {
      return await listCourses();
    } catch (error) {
      console.error("Unable to load public courses", error);
      return [];
    }
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SYNALYX Analytics — School of Data Analytics & Analysis" },
      {
        name: "description",
        content:
          "Learn Excel, SQL, Power BI and Python at SYNALYX Analytics. Structured cohorts, real projects, attendance and assignment tracking in one student portal.",
      },
      { property: "og:title", content: "SYNALYX Analytics — School of Data Analytics" },
      {
        property: "og:description",
        content:
          "Synchronized data, simplified decisions. Train as a data analyst with cohort classes, graded assignments and a full student portal.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(coursesQuery);
  },
  component: Home,
});

const steps = [
  {
    icon: ClipboardList,
    title: "Apply",
    body: "Fill the enrolment form once. Tell us your background, goals and preferred schedule.",
  },
  {
    icon: Users,
    title: "Get approved",
    body: "Our team reviews your application and opens your portal account with a cohort attached.",
  },
  {
    icon: CalendarCheck,
    title: "Learn in cohort",
    body: "Live classes on a fixed timetable, attendance tracked, every session recorded in your portal.",
  },
  {
    icon: BarChart3,
    title: "Build a portfolio",
    body: "Graded assignments on real datasets, with written feedback from your instructor.",
  },
];

function Home() {
  const { data: courses } = useSuspenseQuery(coursesQuery);

  return (
    <SiteLayout>
      <NewsTicker />
      <section className="relative overflow-hidden">
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:py-32">
          <div className="rise-in">
            <p className="font-display text-xs uppercase tracking-[0.4em] text-primary-glow">
              School of data analytics
            </p>
            <h1 className="mt-6 font-display text-5xl font-bold uppercase leading-[0.88] md:text-7xl xl:text-8xl">
              Synchronized
              <br />
              data,
              <br />
              <span className="text-gradient-live">simplified</span>
              <br />
              decisions.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
              SYNALYX Analytics turns beginners into analysts who can clean a messy dataset,
              question it properly and hand a decision-maker something they can act on.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-7 text-base">
                <Link to="/enrol">
                  Enrol for classes <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
                <Link to="/courses">See the tracks</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[26rem] sm:max-w-[30rem]">
            <div className="analytics-orbit pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="analytics-orbit__grid" />
              <div className="analytics-orbit__ring analytics-orbit__ring--outer">
                <span className="analytics-orbit__node analytics-orbit__node--outer-one">
                  <TrendingUp />
                  <span>Growth</span>
                </span>
                <span className="analytics-orbit__node analytics-orbit__node--outer-two">
                  <Database />
                  <span>Data</span>
                </span>
                <span className="analytics-orbit__node analytics-orbit__node--outer-three">
                  <ScatterChart />
                  <span>Model</span>
                </span>
              </div>
              <div className="analytics-orbit__ring analytics-orbit__ring--middle">
                <span className="analytics-orbit__node analytics-orbit__node--middle-one">
                  <PieChart />
                  <span>Share</span>
                </span>
                <span className="analytics-orbit__node analytics-orbit__node--middle-two">
                  <Table2 />
                  <span>Query</span>
                </span>
                <span className="analytics-orbit__node analytics-orbit__node--middle-three">
                  <Gauge />
                  <span>KPI</span>
                </span>
              </div>
              <div className="analytics-orbit__ring analytics-orbit__ring--inner">
                <span className="analytics-orbit__node analytics-orbit__node--inner-one">
                  <Activity />
                  <span>Live</span>
                </span>
                <span className="analytics-orbit__node analytics-orbit__node--inner-two">
                  <Binary />
                  <span>Code</span>
                </span>
              </div>
              <div className="analytics-orbit__sweep" />
            </div>
            <div className="analytics-console relative z-10 flex h-44 w-44 flex-col items-center justify-center rounded-full border border-primary/40 bg-card/90 shadow-[var(--shadow-elevated)] sm:h-52 sm:w-52">
              <LogoMark className="h-20 w-20 object-contain sm:h-24 sm:w-24" />
              <div className="mt-2 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-primary-glow">
                <Sparkles className="h-3 w-3" />
                Live analytics
              </div>
            </div>
            <div className="analytics-readout analytics-readout--top" aria-hidden="true">
              <span className="analytics-readout__pulse" />
              <span>DATA FLOW</span>
              <strong>+24.8%</strong>
            </div>
            <div className="analytics-readout analytics-readout--bottom" aria-hidden="true">
              <span className="analytics-bars"><i /><i /><i /><i /><i /></span>
              <span>INSIGHT ENGINE</span>
            </div>
          </div>
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
          {[
            { value: 5, suffix: "", label: "Career tracks" },
            { value: 24, suffix: " wks", label: "Full bootcamp" },
            { value: 40, suffix: "", label: "Seats per cohort" },
            { value: 100, suffix: "%", label: "Project-based" },
          ].map((s) => (
            <div key={s.label} className="sheen bg-card px-6 py-8 transition-colors hover:bg-accent/40">
              <p className="font-display text-4xl font-bold text-foreground">
                <Counter to={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <ExploreSection />

      <section className="mx-auto max-w-7xl px-5 py-24">
        <Reveal>
          <h2 className="font-display text-3xl font-bold uppercase md:text-5xl">
            The tracks we teach
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Start where you are. Every track runs as a cohort with a fixed timetable, graded
            assignments and attendance you can see in your portal.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, i) => (
            <Reveal key={course.id} delay={i * 70}>
              <Link
                to="/courses"
                className="card-lift sheen group flex h-full flex-col rounded-2xl border border-border bg-card p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    {course.level}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {course.duration_weeks} weeks
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold leading-tight">
                  {course.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {course.summary}
                </p>
                <span className="mt-6 inline-flex items-center text-sm font-medium text-primary-glow">
                  View outline
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-5 py-24">
          <Reveal>
            <h2 className="font-display text-3xl font-bold uppercase md:text-5xl">
              How it works
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <div className="h-full rounded-2xl border border-border bg-background p-7">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary-glow">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-5 font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Step {i + 1}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24">
        <div className="grid gap-14 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-3xl font-bold uppercase md:text-5xl">
              One portal for everything
            </h2>
            <p className="mt-4 text-muted-foreground">
              No scattered WhatsApp groups or lost spreadsheets. Students and staff work from the
              same records.
            </p>
            <ul className="mt-8 space-y-5">
              {[
                {
                  icon: CalendarCheck,
                  title: "Class schedule",
                  body: "Every session with date, topic, instructor and meeting link.",
                },
                {
                  icon: ClipboardList,
                  title: "Assignments & grading",
                  body: "Submit work, receive a score and written feedback.",
                },
                {
                  icon: Database,
                  title: "Attendance records",
                  body: "Marked per session, visible to the student instantly.",
                },
                {
                  icon: LineChart,
                  title: "Admin analytics",
                  body: "Enrolments, attendance rates, grading progress and referral sources.",
                },
              ].map((f) => (
                <li key={f.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary-glow">
                    <f.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="font-display font-bold">{f.title}</p>
                    <p className="text-sm text-muted-foreground">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-3xl border border-border bg-card p-8 glow-ring">
              <p className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Ready when you are
              </p>
              <h3 className="mt-4 font-display text-3xl font-bold leading-tight">
                Applications for the next cohort are open.
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Submit the enrolment form and our team will review it. Once approved you get
                portal access, your cohort timetable and your first assignment.
              </p>
              <Button asChild size="lg" className="mt-8 h-12 w-full text-base">
                <Link to="/enrol">Start your application</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
