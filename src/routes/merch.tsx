import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Timer } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { ReviewPanel, useReviews } from "@/components/site/Reviews";
import { Button } from "@/components/ui/button";
import { listMerch } from "@/lib/content.functions";

export const Route = createFileRoute("/merch")({
  head: () => ({
    meta: [
      { title: "Merch Pre-orders — Synalyx Analyticals" },
      {
        name: "description",
        content:
          "Pre-order Synalyx Analyticals merch: tees, hoodies, caps and data-nerd essentials for our students and community.",
      },
      { property: "og:title", content: "Merch Pre-orders — Synalyx Analyticals" },
      {
        property: "og:description",
        content: "Reserve your Synalyx Analyticals merch before the next production run closes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Merch,
});

function Merch() {
  const { data, isLoading } = useQuery({ queryKey: ["merch"], queryFn: () => listMerch() });
  const reviews = useReviews("merch");
  const items = data ?? [];

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Merch"
        title="Wear the data"
        lead="Limited production runs. Reserve your size with a pre-order link and we'll reach out when the batch ships."
      />

      <section className="mx-auto max-w-7xl px-5 py-20">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-16 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-primary-glow" />
            <h2 className="mt-5 font-display text-2xl font-bold uppercase">No open pre-orders</h2>
            <p className="mt-3 text-muted-foreground">
              The next merch drop hasn&apos;t opened yet. Follow our announcements to be first in line.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((m, i) => (
              <Reveal key={m.id} delay={(i % 3) * 80}>
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="aspect-square overflow-hidden bg-secondary">
                    {m.image_url ? (
                      <img
                        src={m.image_url}
                        alt={m.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                      {m.name}
                    </h2>
                    {m.description && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {m.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-display text-xl font-bold">
                        {m.price === null ? "Ask" : `${m.currency} ${Number(m.price).toLocaleString()}`}
                      </span>
                      {m.available_until && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Timer className="h-3.5 w-3.5" />
                          till {new Date(m.available_until).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="mt-4">
                      <ReviewPanel
                        targetType="merch"
                        targetId={m.id}
                        title={m.name}
                        reviews={reviews.get(m.id) ?? []}
                      />
                    </div>
                    <Button asChild className="mt-5 w-full">
                      <a href={m.preorder_url ?? "#"} target="_blank" rel="noopener noreferrer">
                        Pre-order now
                      </a>
                    </Button>

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
