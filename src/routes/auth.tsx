import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/components/auth/AuthProvider";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const USERNAME_DOMAIN = "synalyx.com";

function toEmail(identifier: string) {
  const value = identifier.trim().toLowerCase();
  return value.includes("@") ? value : `${value}@${USERNAME_DOMAIN}`;
}

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    portal: search["portal"] === "admin" ? ("admin" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — SYNALYX Analytics" },
      {
        name: "description",
        content: "Sign in to the SYNALYX Analytics student and admin portal.",
      },
      { property: "og:title", content: "Sign in — SYNALYX Analytics" },
      { property: "og:description", content: "Access your SYNALYX Analytics portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading, isStaff } = useAuth();
  const { portal } = Route.useSearch();
  const navigate = useNavigate();
  const staffMode = portal === "admin";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: isStaff && staffMode ? "/admin" : "/dashboard", replace: true });
    }
  }, [loading, user, isStaff, staffMode, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const email = toEmail(identifier);
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: staffMode ? "/admin" : "/dashboard", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
        } else {
          navigate({ to: "/dashboard", replace: true });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="grid-noise pointer-events-none absolute inset-0 opacity-60" />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-primary), transparent 70%)" }}
      />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo showTagline />
        </Link>

        <div className="rounded-3xl border border-border bg-card p-8">
          {staffMode && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-glow">
              <ShieldCheck className="h-3.5 w-3.5" /> Staff access
            </div>
          )}
          <h1 className="font-display text-2xl font-bold">
            {staffMode
              ? "Administrator sign in"
              : mode === "signin"
                ? "Sign in to your portal"
                : "Create your portal account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {staffMode
              ? "Use your staff username and password."
              : mode === "signin"
                ? "Approved students and staff only."
                : "Use the same email you applied with — access unlocks once your application is approved."}
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            {mode === "signup" && !staffMode && (
              <div>
                <Label className="mb-2 block text-sm">Full name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={120}
                />
              </div>
            )}
            <div>
              <Label className="mb-2 block text-sm">
                {staffMode ? "Username" : "Email or username"}
              </Label>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={staffMode ? "admin.synalyx" : "you@example.com"}
                autoComplete="username"
                required
                maxLength={255}
              />
            </div>
            <div>
              <Label className="mb-2 block text-sm">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={72}
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          {!staffMode && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or{" "}
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button variant="outline" className="h-11 w-full" onClick={google}>
                Continue with Google
              </Button>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="font-medium text-primary-glow hover:underline"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? "Create one" : "Sign in"}
                </button>
              </p>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Not applied yet?{" "}
                <Link to="/enrol" className="underline">
                  Enrol here
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
