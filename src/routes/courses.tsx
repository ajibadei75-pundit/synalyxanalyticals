import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { listCourses, listOpenCohorts } from "@/lib/public.functions";

const coursesQuery = queryOptions({
  queryKey: ["public", "courses"],
  queryFn: () => listCourses(),
});
const cohortsQuery = queryOptions({
  queryKey: ["public", "cohorts"],
  queryFn: () => listOpenCohorts(),
});

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses — SYNALYX Analytics" },
      {
        name: "description",
        content:
          "Excel for analysts, SQL, Power BI, Python and the full Data Analytics Bootcamp. Outlines, duration, fees and open cohorts.",
      },
      { property: "og:title", content: "Courses — SYNALYX Analytics" },
      {
        property: "og:description",
        content:
          "Cohort-based data analytics training: Excel, SQL, Power BI, Python and a 24-week bootcamp.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(coursesQuery);
    context.queryClient.ensureQueryData(cohortsQuery);
  },
  component: Courses,
});

function formatFee(fee: number | null) {
  if (fee === null || fee === undefined) return "Contact us";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(fee);
}

function Courses() {
  const { data: courses } = useSuspenseQuery(coursesQuery);
  const { data: cohorts } = useSuspenseQuery(cohortsQuery);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Curriculum"
        title="Tracks built around the work analysts actually do"
        lead="Each track is hands-on from week one. You work with real datasets, submit assignments and get graded feedback."
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-20">
        {courses.map((course, i) => {
          const open = cohorts.filter((c) => c.course_id === course.id);
          const outline = Array.isArray(course.outline) ? (course.outline as string[]) : [];
          return (
            <Reveal key={course.id} delay={i * 60}>
              <article className="grid gap-8 rounded-3xl border border-border bg-card p-8 lg:grid-cols-[1.4fr_1fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                      {course.level}
                    </span>
                    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                      {course.duration_weeks} weeks
                    </span>
                  </div>
                  <h2 className="mt-5 font-display text-3xl font-bold leading-tight">
                    {course.title}
                  </h2>
                  <p className="mt-3 text-muted-foreground">{course.description ?? course.summary}</p>

                  {outline.length > 0 && (
                    <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                      {outline.map((item) => (
                        <li key={item} className="flex gap-2.5 text-sm text-muted-foreground">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-glow" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-background p-6">
                  <p className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Tuition
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold">{formatFee(course.fee)}</p>

                  <p className="mt-6 font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Open cohorts
                  </p>
                  {open.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No open cohort right now — apply to join the waiting list.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2.5">
                      {open.map((c) => (
                        <li key={c.id} className="rounded-lg border border-border px-3 py-2.5">
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Starts {new Date(c.start_date).toLocaleDateString()} · {c.mode} ·{" "}
                            {c.schedule}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button asChild className="mt-6 w-full">
                    <Link to="/enrol" search={{ course: course.slug }}>
                      Apply for this track
                    </Link>
                  </Button>
                </div>
              </article>
            </Reveal>
          );
        })}
      </section>
    </SiteLayout>
  );
}
