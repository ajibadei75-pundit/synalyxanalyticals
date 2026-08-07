import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, LineChart } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { listProjects } from "@/lib/content.functions";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Student Projects — Synalyx Analyticals" },
      {
        name: "description",
        content:
          "Dashboards, models and analyses built by Synalyx Analyticals students across Excel, SQL, Power BI and Python.",
      },
      { property: "og:title", content: "Student Projects — Synalyx Analyticals" },
      {
        property: "og:description",
        content: "See the real dashboards and analyses our students ship.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Projects,
});

function Projects() {
  const { data, isLoading } = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });
  const items = data ?? [];

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Projects"
        title="Work our students ship"
        lead="Every track ends with real analysis on real data. Here's a look at what comes out of the studio."
      />

      <section className="mx-auto max-w-7xl px-5 py-20">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-16 text-center">
            <LineChart className="mx-auto h-8 w-8 text-primary-glow" />
            <h2 className="mt-5 font-display text-2xl font-bold uppercase">Showcase in progress</h2>
            <p className="mt-3 text-muted-foreground">
              Current cohorts are still building. Their projects will land here soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {items.map((p, i) => (
              <Reveal key={p.id} delay={(i % 2) * 80}>
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
                  {p.image_url && (
                    <div className="aspect-video overflow-hidden bg-secondary">
                      <img
                        src={p.image_url}
                        alt={p.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-7">
                    <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                      {p.title}
                    </h2>
                    {p.author_name && (
                      <p className="mt-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                        by {p.author_name}
                      </p>
                    )}
                    {p.summary && (
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        {p.summary}
                      </p>
                    )}
                    {p.tools.length > 0 && (
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {p.tools.map((t) => (
                          <li
                            key={t}
                            className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground"
                          >
                            {t}
                          </li>
                        ))}
                      </ul>
                    )}
                    {p.project_url && (
                      <a
                        href={p.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-glow hover:underline"
                      >
                        View project <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
