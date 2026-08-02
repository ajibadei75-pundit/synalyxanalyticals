import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAssignmentByToken, submitAssignment } from "@/lib/portal.functions";
import { extensionOf } from "@/lib/schemas";

export const Route = createFileRoute("/submit/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Submit assignment — SYNALYX Analytics" },
      {
        name: "description",
        content: "Upload your assignment to SYNALYX Analytics in the required format.",
      },
      { property: "og:title", content: "Submit assignment — SYNALYX Analytics" },
      { property: "og:description", content: "Secure assignment submission link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubmitPage,
});

function SubmitPage() {
  const { token } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchAssignment = useServerFn(getAssignmentByToken);
  const submit = useServerFn(submitAssignment);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["assignment-token", token, user?.id],
    enabled: !!user,
    queryFn: () => fetchAssignment({ data: { token } }),
  });

  useEffect(() => {
    if (data?.submission) setContent(data.submission.content ?? "");
  }, [data?.submission]);

  if (loading || !user) return null;

  const assignment = data?.assignment;
  const formats = (assignment?.allowed_formats ?? []).map((f) => f.toLowerCase());

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;
    setBusy(true);
    try {
      let fileUrl: string | null = null;

      if (file) {
        const ext = extensionOf(file.name);
        if (!formats.includes(ext)) {
          throw new Error(`Only ${formats.join(", ").toUpperCase()} files are accepted.`);
        }
        if (file.size > assignment.max_file_mb * 1024 * 1024) {
          throw new Error(`File must be under ${assignment.max_file_mb}MB.`);
        }
        const path = `${user.id}/${assignment.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const { error } = await supabase.storage.from("submissions").upload(path, file, {
          upsert: true,
        });
        if (error) throw error;
        fileUrl = path;
      } else if (link.trim()) {
        if (!assignment.accepts_link) throw new Error("Links are not accepted for this assignment.");
        if (!/^https:\/\//i.test(link.trim())) throw new Error("Use a secure https link.");
        const ext = extensionOf(link.trim());
        if (ext && !formats.includes(ext)) {
          throw new Error(`Only ${formats.join(", ").toUpperCase()} files are accepted.`);
        }
        fileUrl = link.trim();
      }

      await submit({ data: { assignment_id: assignment.id, content, file_url: fileUrl } });
      toast.success("Submission received");
      setFile(null);
      setLink("");
      void refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-5 py-16">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading assignment…</p>
        ) : !assignment ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center">
            <h1 className="font-display text-2xl font-bold">Link not valid</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This submission link is invalid or belongs to a cohort you're not enrolled in.
            </p>
            <Button asChild className="mt-6">
              <Link to="/dashboard">Back to portal</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="font-display text-xs uppercase tracking-[0.35em] text-primary-glow">
              Assignment submission
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight">
              {assignment.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">Due {new Date(assignment.due_at).toLocaleString()}</Badge>
              <Badge variant="secondary">{formats.join(", ").toUpperCase()} only</Badge>
              <Badge variant="secondary">Max {assignment.max_file_mb}MB</Badge>
              <Badge variant={assignment.is_open ? "default" : "destructive"}>
                {assignment.is_open ? "Open" : "Closed"}
              </Badge>
            </div>
            {assignment.brief && (
              <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {assignment.brief}
              </p>
            )}
            {assignment.resource_url && (
              <a
                className="mt-3 inline-block text-sm text-primary-glow underline"
                href={assignment.resource_url}
                target="_blank"
                rel="noreferrer noopener"
              >
                Download the starter resource
              </a>
            )}

            {data?.submission?.graded_at ? (
              <div className="mt-8 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6">
                <p className="font-display text-lg font-bold">
                  Graded: {data.submission.score}/{assignment.max_score}
                </p>
                {data.submission.feedback && (
                  <p className="mt-2 text-sm text-muted-foreground">{data.submission.feedback}</p>
                )}
              </div>
            ) : (
              <form
                onSubmit={onSubmit}
                className="mt-8 space-y-5 rounded-3xl border border-border bg-card p-7"
              >
                <div>
                  <Label className="mb-2 block text-sm">Your notes / answer</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    maxLength={4000}
                    placeholder="Summarise your approach, findings or anything the instructor should know."
                  />
                </div>
                <div>
                  <Label className="mb-2 block text-sm">
                    Upload file ({formats.join(", ").toUpperCase()})
                  </Label>
                  <Input
                    type="file"
                    accept={formats.map((f) => `.${f}`).join(",")}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                {assignment.accepts_link && (
                  <div>
                    <Label className="mb-2 block text-sm">…or paste a secure https link</Label>
                    <Input
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://drive.google.com/…"
                      maxLength={500}
                    />
                  </div>
                )}
                <Button type="submit" className="h-11 w-full" disabled={busy || !assignment.is_open}>
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="mr-2 h-4 w-4" />
                  )}
                  {data?.submission ? "Update submission" : "Submit assignment"}
                </Button>
                {data?.submission && (
                  <p className="text-center text-xs text-muted-foreground">
                    Last submitted {new Date(data.submission.submitted_at).toLocaleString()}
                  </p>
                )}
              </form>
            )}
          </>
        )}
      </section>
    </SiteLayout>
  );
}
