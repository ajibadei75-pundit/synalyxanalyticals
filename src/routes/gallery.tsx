import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, PlayCircle } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { listGallery } from "@/lib/content.functions";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Event Gallery — Synalyx Analyticals" },
      {
        name: "description",
        content:
          "Photos and videos from Synalyx Analyticals bootcamps, data clinics, graduations and community meet-ups.",
      },
      { property: "og:title", content: "Event Gallery — Synalyx Analyticals" },
      {
        property: "og:description",
        content: "Relive past Synalyx Analyticals events through photos and videos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  const { data, isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => listGallery(),
  });

  const items = data ?? [];

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Gallery"
        title="Moments from our events"
        lead="Bootcamp sessions, data clinics, graduations and community meet-ups — captured as they happened."
      />

      <section className="mx-auto max-w-7xl px-5 py-20">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-16 text-center">
            <h2 className="font-display text-2xl font-bold uppercase">Gallery coming soon</h2>
            <p className="mt-3 text-muted-foreground">
              Our team is uploading highlights from recent events. Check back shortly.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((m, i) => (
              <Reveal key={m.id} delay={(i % 3) * 80}>
                <figure className="group h-full overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="relative aspect-video overflow-hidden bg-secondary">
                    {m.media_type === "video" ? (
                      <video
                        src={m.url}
                        controls
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={m.url}
                        alt={m.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    {m.media_type === "video" && (
                      <PlayCircle className="pointer-events-none absolute right-3 top-3 h-6 w-6 text-primary-glow" />
                    )}
                  </div>
                  <figcaption className="p-5">
                    <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                      {m.title}
                    </h2>
                    {m.description && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {m.description}
                      </p>
                    )}
                    {m.event_date && (
                      <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(m.event_date).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
