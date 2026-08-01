import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — SYNALYX Analytics" },
      {
        name: "description",
        content:
          "Why SYNALYX Analytics exists, how we teach data analytics, and what students can expect from a cohort.",
      },
      { property: "og:title", content: "About SYNALYX Analytics" },
      {
        property: "og:description",
        content:
          "A school built on one idea: synchronized data, simplified decisions. Meet our teaching approach.",
      },
    ],
  }),
  component: About,
});

const values = [
  {
    title: "Evidence over opinion",
    body: "We teach students to defend a number. Every claim traces back to a query, a source and a method.",
  },
  {
    title: "Small cohorts",
    body: "Capped seats so instructors can actually read your work and reply with something useful.",
  },
  {
    title: "Tools employers use",
    body: "Excel, SQL, Power BI and Python — the stack that appears in almost every analyst job listing.",
  },
  {
    title: "Records that matter",
    body: "Attendance, grades and feedback are stored properly, so your progress is provable.",
  },
];

function About() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="About us"
        title="A school for people who want data to mean something"
        lead="SYNALYX Analytics was built for career switchers, graduates and working professionals who keep hearing that data is important but were never shown how to work with it."
      />

      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-14 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-3xl font-bold uppercase">Our approach</h2>
            <div className="mt-5 space-y-4 text-muted-foreground">
              <p>
                Classes run as cohorts on a fixed timetable. You show up, you build, you submit.
                Instructors grade every assignment and write back — no auto-marked quizzes standing
                in for feedback.
              </p>
              <p>
                By the end of a track you will have cleaned real datasets, written queries against
                a live database, built dashboards someone could actually use in a meeting, and
                presented findings clearly enough for a non-technical audience.
              </p>
              <p>
                Everything you produce lives in your portal alongside your attendance and grades,
                so you leave with a record of the work, not just a certificate.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="grid gap-4 sm:grid-cols-2">
              {values.map((v) => (
                <div key={v.title} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-display text-lg font-bold leading-tight">{v.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal>
          <div className="mt-16 flex flex-col items-start gap-6 rounded-3xl border border-border bg-card p-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold uppercase">Join the next cohort</h2>
              <p className="mt-2 text-muted-foreground">
                Applications are reviewed by our team, usually within a few days.
              </p>
            </div>
            <Button asChild size="lg" className="h-12 px-7">
              <Link to="/enrol">Enrol now</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </SiteLayout>
  );
}
