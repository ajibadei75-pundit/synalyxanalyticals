import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="grid-noise pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-5 py-20">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-primary-glow">
          {eyebrow}
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[0.95] md:text-6xl">
          {title}
        </h1>
        {lead && <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{lead}</p>}
        {children}
      </div>
    </section>
  );
}
