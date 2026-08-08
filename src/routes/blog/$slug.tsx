import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, BookOpen, Clock, Eye, User } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { ReviewPanel, useReviews } from "@/components/site/Reviews";
import { Button } from "@/components/ui/button";
import { getBlogPost } from "@/lib/content.functions";
import type { BlogBlock } from "@/lib/content.schemas";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getBlogPost({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Article"} — Synalyx Analyticals` },
      { name: "description", content: loaderData?.excerpt ?? "Analytics writing from Synalyx." },
      { property: "og:title", content: loaderData?.title ?? "Synalyx Analyticals article" },
      { property: "og:description", content: loaderData?.excerpt ?? "" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(loaderData?.cover_image_url?.startsWith("https://")
        ? [
            { property: "og:image", content: loaderData.cover_image_url },
            { name: "twitter:image", content: loaderData.cover_image_url },
          ]
        : []),
    ],
  }),
  errorComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-5 py-28 text-center">
        <h1 className="font-display text-3xl font-bold uppercase">Article unavailable</h1>
        <p className="mt-4 text-muted-foreground">Something went wrong loading this article.</p>
        <Button asChild className="mt-8">
          <Link to="/blog">Back to the blog</Link>
        </Button>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-5 py-28 text-center">
        <h1 className="font-display text-3xl font-bold uppercase">Article not found</h1>
        <p className="mt-4 text-muted-foreground">This post may have been unpublished.</p>
        <Button asChild className="mt-8">
          <Link to="/blog">Back to the blog</Link>
        </Button>
      </div>
    </SiteLayout>
  ),
  component: BlogPost,
});

function BlogPost() {
  const post = Route.useLoaderData();
  const slug = Route.useParams().slug;
  const load = useServerFn(getBlogPost);
  const { data } = useQuery({
    queryKey: ["blog", slug],
    queryFn: () => load({ data: { slug } }),
    initialData: post,
    staleTime: 60_000,
  });
  const reviews = useReviews("blog");
  const article = data ?? post;
  const blocks = (article.body ?? []) as BlogBlock[];

  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-5 pb-24 pt-14">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>

        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-primary-glow">
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {article.read_minutes} min read
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> {article.view_count} views
            </span>
          </div>

          <h1 className="mt-5 font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight md:text-5xl">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-border/60 py-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <User className="h-4 w-4 text-primary-glow" /> {article.author_name}
            </span>
            <span>
              {new Date(article.published_at).toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <ReviewPanel
              targetType="blog"
              targetId={article.id}
              title={article.title}
              reviews={reviews.get(article.id) ?? []}
            />
          </div>
        </header>

        {article.cover_image_url && (
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="mt-10 aspect-video w-full rounded-2xl border border-border object-cover"
          />
        )}

        <div className="mt-12 space-y-7">
          {blocks.length === 0 && (
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" /> This article has no content yet.
            </p>
          )}
          {blocks.map((block, i) => (
            <Reveal key={i} delay={Math.min(i, 4) * 60}>
              <Block block={block} />
            </Reveal>
          ))}
        </div>

        {article.tags.length > 0 && (
          <ul className="mt-12 flex flex-wrap gap-2">
            {article.tags.map((t: string) => (
              <li
                key={t}
                className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground"
              >
                #{t}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-14 rounded-3xl border border-border bg-card p-8 text-center">
          <h2 className="font-display text-2xl font-bold uppercase">Ready to learn this properly?</h2>
          <p className="mt-3 text-muted-foreground">
            Join a Synalyx Analyticals cohort and build these skills with real data and real feedback.
          </p>
          <Button asChild className="mt-6">
            <Link to="/enrol">Enrol now</Link>
          </Button>
        </div>
      </article>
    </SiteLayout>
  );
}

function Block({ block }: { block: BlogBlock }) {
  if (block.type === "heading")
    return (
      <h2 className="font-display text-2xl font-bold uppercase tracking-tight">{block.text}</h2>
    );
  if (block.type === "paragraph")
    return <p className="text-base leading-8 text-muted-foreground">{block.text}</p>;
  if (block.type === "quote")
    return (
      <blockquote className="rounded-2xl border-l-4 border-primary bg-card/70 px-6 py-5 font-display text-lg leading-relaxed">
        {block.text}
      </blockquote>
    );
  if (block.type === "list")
    return (
      <ul className="space-y-2.5">
        {block.items.map((item, i) => (
          <li key={i} className="flex gap-3 text-muted-foreground">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-glow" />
            <span className="leading-7">{item}</span>
          </li>
        ))}
      </ul>
    );
  return (
    <figure>
      <img
        src={block.url}
        alt={block.caption || "Article illustration"}
        loading="lazy"
        className="w-full rounded-2xl border border-border object-cover"
      />
      {block.caption && (
        <figcaption className="mt-3 text-center text-xs text-muted-foreground">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}
