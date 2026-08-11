import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, BookOpen, Images, ShoppingBag, Sparkles } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { listBlogPosts, listGallery, listMerch, listProjects } from "@/lib/content.functions";

export function ExploreSection() {
  const blog = useServerFn(listBlogPosts);
  const gallery = useServerFn(listGallery);
  const merch = useServerFn(listMerch);
  const projects = useServerFn(listProjects);

  const posts = useQuery({ queryKey: ["blog"], queryFn: () => blog(), staleTime: 60_000 });
  const media = useQuery({ queryKey: ["gallery"], queryFn: () => gallery(), staleTime: 60_000 });
  const shop = useQuery({ queryKey: ["merch"], queryFn: () => merch(), staleTime: 60_000 });
  const work = useQuery({ queryKey: ["projects"], queryFn: () => projects(), staleTime: 60_000 });

  const latestPost = posts.data?.[0];
  const latestProject = work.data?.[0];
  const latestMerch = shop.data?.[0];
  const shots = (media.data ?? []).filter((m) => m.media_type === "image").slice(0, 4);

  return (
    <section className="mx-auto max-w-7xl px-5 py-20">
      <Reveal>
        <p className="font-display text-xs uppercase tracking-[0.3em] text-primary-glow">
          Explore Synalyx
        </p>
        <h2 className="mt-4 font-display text-3xl font-bold uppercase leading-tight tracking-tight md:text-4xl">
          Read, watch, wear and see the work
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Fresh tutorials from our instructors, student projects, event highlights and school merch
          — all open to browse, rate and review.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <Reveal>
          <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition-colors hover:border-primary/50">
            <div className="aspect-video overflow-hidden bg-secondary">
              {latestPost?.cover_image_url ? (
                <img
                  src={latestPost.cover_image_url}
                  alt={latestPost.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/25 to-transparent">
                  <BookOpen className="h-9 w-9 text-primary-glow" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Latest article
              </p>
              <h3 className="mt-3 font-display text-lg font-bold uppercase leading-snug">
                {latestPost?.title ?? "Analytics writing, coming soon"}
              </h3>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                {latestPost?.excerpt ??
                  "Our instructors are writing tutorials, dashboard teardowns and career notes."}
              </p>
              <Link
                to="/blog"
                className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-primary-glow hover:underline"
              >
                Read the blog <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </Reveal>

        <Reveal delay={80}>
          <article className="flex h-full flex-col rounded-3xl border border-border bg-card p-6">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary-glow" /> Student projects
            </p>
            <h3 className="mt-3 font-display text-lg font-bold uppercase leading-snug">
              {latestProject?.title ?? "Real dashboards from real cohorts"}
            </h3>
            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
              {latestProject?.summary ??
                "Every learner ships a portfolio project judged on data quality, insight and design."}
            </p>

            <div className="mt-6 grid grid-cols-4 gap-2">
              {shots.length > 0
                ? shots.map((m) => (
                    <img
                      key={m.id}
                      src={m.url}
                      alt={m.title}
                      loading="lazy"
                      className="aspect-square w-full rounded-lg border border-border object-cover"
                    />
                  ))
                : [0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex aspect-square items-center justify-center rounded-lg border border-border bg-secondary"
                    >
                      <Images className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
            </div>

            <div className="mt-auto flex flex-wrap gap-4 pt-6 text-sm font-semibold">
              <Link to="/projects" className="inline-flex items-center gap-2 text-primary-glow hover:underline">
                Projects <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/gallery" className="inline-flex items-center gap-2 text-primary-glow hover:underline">
                Gallery <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </Reveal>

        <Reveal delay={160}>
          <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card">
            <div className="aspect-video overflow-hidden bg-secondary">
              {latestMerch?.image_url ? (
                <img
                  src={latestMerch.image_url}
                  alt={latestMerch.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-transparent">
                  <ShoppingBag className="h-9 w-9 text-primary-glow" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Merch pre-order
              </p>
              <h3 className="mt-3 font-display text-lg font-bold uppercase leading-snug">
                {latestMerch?.name ?? "Synalyx school merch"}
              </h3>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                {latestMerch?.description ??
                  "Tees, hoodies and stickers for the cohort — pre-order drops announced here."}
              </p>
              <Link
                to="/merch"
                className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-primary-glow hover:underline"
              >
                See the drop <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
