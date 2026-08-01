import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Student portal — SYNALYX Analytics" },
      {
        name: "description",
        content: "Your cohort schedule, assignments, attendance and grades at SYNALYX Analytics.",
      },
      { property: "og:title", content: "Student portal — SYNALYX Analytics" },
      { property: "og:description", content: "Schedule, assignments, attendance and grades." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading, signOut, isStaff } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-primary-glow">
          Student portal
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold uppercase">
          Welcome back{user.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Your schedule, assignments, attendance and grades will appear here as your cohort is
          activated.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {isStaff && (
            <Button asChild variant="outline">
              <Link to="/admin">Go to admin</Link>
            </Button>
          )}
          <Button variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
