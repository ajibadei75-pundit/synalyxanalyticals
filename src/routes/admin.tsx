import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/components/auth/AuthProvider";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — SYNALYX Analytics" },
      {
        name: "description",
        content: "Manage applications, students, cohorts, sessions and grading at SYNALYX Analytics.",
      },
      { property: "og:title", content: "Admin — SYNALYX Analytics" },
      { property: "og:description", content: "Applications, students, cohorts and analytics." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { user, loading, isStaff } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-primary-glow">
          Administration
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold uppercase">Control centre</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          {isStaff
            ? "Applications, student management, cohorts, sessions, grading and analytics land here next."
            : "You don't have staff access to this area."}
        </p>
      </section>
    </SiteLayout>
  );
}
