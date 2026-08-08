import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, BookOpen, Clock, Eye } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { ReviewPanel, useReviews } from "@/components/site/Reviews";
import { listBlogPosts } from "@/lib/content.functions";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Data Blog — Synalyx Analyticals" },
      {
        name: "description",
        content:
          "Tutorials, career notes and analytics playbooks from the Synalyx Analyticals team — Excel, SQL, Power BI and Python explained simply.",
      },
      { property: "og:title", content: "Data Blog — Synalyx Analyticals" },
      {
        property: "og:description",
        content: "Read analytics tutorials and career guides from Synalyx Analyticals instructors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const load = useServerFn(listBlogPosts);
  const { data, isLoading } = useQuery({ queryKey: ["blog"], queryFn: () => load() });
  const reviews = useReviews("blog");
  const posts = data ?? [];
  const [featured, ...rest] = posts;

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Blog"
        title="Notes from the data floor"
        lead="Tutorials, teardown of real dashboards and honest career advice — written by the instructors who teach our cohorts."
      />

      <section className="mx-auto max-w-7xl px-5 py-20">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-16 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-primary-glow" />
            <h2 className="mt-5 font-display text-2xl font-bold uppercase">First article incoming</h2>
            <p className="mt-3 text-muted-foreground">
              Our instructors are writing. Check back soon for tutorials and playbooks.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {featured && (
              <Reveal>
                <article className="grid overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-2">
                  <div className="aspect-video bg-secondary lg:aspect-auto">
                    {featured.cover_image_url ? (
                      <img
                        src={featured.cover_image_url}
                        alt={featured.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full min-h-56 items-center justify-center bg-gradient-to-br from-primary/25 to-transparent">
                        <BookOpen className="h-10 w-10 text-primary-glow" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center p-8 lg:p-12">
                    <PostMeta post={featured} />
                    <h2 className="mt-4 font-display text-3xl font-bold uppercase leading-tight tracking-tight">
                      {featured.title}
                    </h2>
                    <p className="mt-4 leading-relaxed text-muted-foreground">{featured.excerpt}</p>
                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      <Link
                        to="/blog/$slug"
                        params={{ slug: featured.slug }}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary-glow hover:underline"
                      >
                        Read article <ArrowRight className="h-4 w-4" />
                      </Link>
                      <ReviewPanel
                        targetType="blog"
                        targetId={featured.id}
                        title={featured.title}
                        reviews={reviews.get(featured.id) ?? []}
                      />
                    </div>
                  </div>
                </article>
              </Reveal>
            )}

            {rest.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 3) * 80}>
                    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50">
                      <div className="aspect-video overflow-hidden bg-secondary">
                        {p.cover_image_url ? (
                          <img
                            src={p.cover_image_url}
                            alt={p.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-transparent">
                            <BookOpen className="h-8 w-8 text-primary-glow" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <PostMeta post={p} />
                        <h2 className="mt-3 font-display text-lg font-bold uppercase leading-snug tracking-tight">
                          {p.title}
                        </h2>
                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {p.excerpt}
                        </p>
                        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                          <Link
                            to="/blog/$slug"
                            params={{ slug: p.slug }}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary-glow hover:underline"
                          >
                            Read <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                          <ReviewPanel
                            targetType="blog"
                            targetId={p.id}
                            title={p.title}
                            reviews={reviews.get(p.id) ?? []}
                          />
                        </div>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

function PostMeta({
  post,
}: {
  post: { category: string; read_minutes: number; view_count: number; published_at: string };
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
      <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-primary-glow">
        {post.category}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" /> {post.read_minutes} min
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5" /> {post.view_count}
      </span>
    </div>
  );
}
