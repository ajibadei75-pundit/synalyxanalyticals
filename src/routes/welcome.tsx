import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Images, LineChart, ShoppingBag } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { listGallery, listMerch, listProjects } from "@/lib/content.functions";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome back — Synalyx Analyticals" },
      {
        name: "description",
        content:
          "Your Synalyx Analyticals home base: latest event highlights, open merch pre-orders, student projects and a shortcut to your portal.",
      },
      { property: "og:title", content: "Welcome back — Synalyx Analyticals" },
      {
        property: "og:description",
        content: "Event highlights, merch pre-orders and student projects in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const { user, loading } = useAuth();
  const displayName =
    (user?.user_metadata?.["full_name"] as string | undefined) ?? user?.email?.split("@")[0] ?? "";
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: {}, replace: true });
  }, [loading, user, navigate]);

  const gallery = useQuery({ queryKey: ["gallery"], queryFn: () => listGallery() });
  const merch = useQuery({ queryKey: ["merch"], queryFn: () => listMerch() });
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });

  const media = (gallery.data ?? []).slice(0, 3);
  const drops = (merch.data ?? []).slice(0, 3);
  const work = (projects.data ?? []).slice(0, 2);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Welcome back"
        title={displayName ? `Hello, ${displayName.split(" ")[0]}` : "Hello again"}
        lead="Here's what's happening across the school right now — then jump straight into your portal."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-12 px-7">
            <Link to="/dashboard">
              Open my portal <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-7">
            <Link to="/gallery">Browse the gallery</Link>
          </Button>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <SectionHead
          icon={<Images className="h-4 w-4" />}
          title="Latest event highlights"
          to="/gallery"
          cta="All media"
        />
        {media.length === 0 ? (
          <EmptyNote text="Event photos and videos will appear here as soon as the team uploads them." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((m, i) => (
              <Reveal key={m.id} delay={i * 70}>
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="aspect-video bg-secondary">
                    {m.media_type === "video" ? (
                      <video src={m.url} controls className="h-full w-full object-cover" />
                    ) : (
                      <img
                        src={m.url}
                        alt={m.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <p className="p-5 font-display text-sm font-bold uppercase tracking-tight">
                    {m.title}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <SectionHead
          icon={<ShoppingBag className="h-4 w-4" />}
          title="Open merch pre-orders"
          to="/merch"
          cta="All merch"
        />
        {drops.length === 0 ? (
          <EmptyNote text="No merch drop is open right now. We'll notify you when the next batch opens." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {drops.map((m, i) => (
              <Reveal key={m.id} delay={i * 70}>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-display text-lg font-bold uppercase tracking-tight">
                    {m.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{m.description}</p>
                  <Button asChild size="sm" className="mt-5">
                    <a href={m.preorder_url ?? "#"} target="_blank" rel="noopener noreferrer">
                      Pre-order
                    </a>
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24">
        <SectionHead
          icon={<LineChart className="h-4 w-4" />}
          title="Fresh student projects"
          to="/projects"
          cta="All projects"
        />
        {work.length === 0 ? (
          <EmptyNote text="Project showcases from current cohorts are on the way." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {work.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}>
                <div className="h-full rounded-2xl border border-border bg-card p-7">
                  <h3 className="font-display text-lg font-bold uppercase tracking-tight">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">{p.summary}</p>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

function SectionHead({
  icon,
  title,
  to,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  to: "/gallery" | "/merch" | "/projects";
  cta: string;
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <h2 className="inline-flex items-center gap-3 font-display text-2xl font-bold uppercase tracking-tight">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary-glow">
          {icon}
        </span>
        {title}
      </h2>
      <Link to={to} className="text-sm font-medium text-primary-glow hover:underline">
        {cta}
      </Link>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
