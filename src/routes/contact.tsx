import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — SYNALYX Analytics" },
      {
        name: "description",
        content:
          "Talk to the SYNALYX Analytics team about cohorts, tuition, corporate training or the student portal.",
      },
      { property: "og:title", content: "Contact SYNALYX Analytics" },
      {
        property: "og:description",
        content: "Questions about cohorts, tuition or corporate training? Reach the team.",
      },
    ],
  }),
  component: Contact,
});

const channels = [
  { icon: Mail, label: "Email", value: "hello@synalyx.com" },
  { icon: Phone, label: "Phone", value: "+000 000 0000" },
  { icon: MessageCircle, label: "WhatsApp", value: "+000 000 0000" },
  { icon: MapPin, label: "Campus", value: "Add your campus address" },
];

function Contact() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Contact"
        title="Talk to the team"
        lead="Questions about a track, tuition, corporate training or your portal account? Reach out and we'll respond."
      />

      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((c, i) => (
            <Reveal key={c.label} delay={i * 70}>
              <div className="h-full rounded-2xl border border-border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary-glow">
                  <c.icon className="h-4.5 w-4.5" />
                </div>
                <p className="mt-5 font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {c.label}
                </p>
                <p className="mt-1.5 text-sm">{c.value}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-14 rounded-3xl border border-border bg-card p-10 text-center">
            <h2 className="font-display text-3xl font-bold uppercase">
              Ready to enrol instead?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              The enrolment form takes a few minutes and doubles as your application. No payment
              is required to apply.
            </p>
            <Button asChild size="lg" className="mt-8 h-12 px-7">
              <Link to="/enrol">Open the enrolment form</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </SiteLayout>
  );
}
