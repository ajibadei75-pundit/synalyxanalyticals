import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  Images,
  Loader2,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { BlogComposer } from "@/components/site/BlogComposer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import {
  createMedia,
  createMerch,
  createProject,
  deleteContentItem,
  listContentAdmin,
  toggleContentPublished,
} from "@/lib/content.functions";

export const Route = createFileRoute("/admin-content")({
  head: () => ({
    meta: [
      { title: "Content Studio — Synalyx Analyticals Admin" },
      {
        name: "description",
        content:
          "Upload event photos and videos, publish merch pre-order links and showcase student projects.",
      },
      { property: "og:title", content: "Content Studio — Synalyx Analyticals Admin" },
      { property: "og:description", content: "Manage gallery, merch and project content." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContentStudio,
});

const MAX_UPLOAD_MB = 100;

function ContentStudio() {
  const { user, loading, isStaff } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { portal: "admin" }, replace: true });
  }, [loading, user, navigate]);

  const load = useServerFn(listContentAdmin);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-content"],
    queryFn: () => load(),
    enabled: Boolean(user) && isStaff,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-content"] });
    queryClient.invalidateQueries({ queryKey: ["gallery"] });
    queryClient.invalidateQueries({ queryKey: ["merch"] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["blog"] });
  };

  const addMedia = useServerFn(createMedia);
  const addMerch = useServerFn(createMerch);
  const addProject = useServerFn(createProject);
  const removeItem = useServerFn(deleteContentItem);
  const togglePublished = useServerFn(toggleContentPublished);

  const deleteMutation = useMutation({
    mutationFn: (vars: { kind: "media" | "merch" | "project" | "blog"; id: string }) =>
      removeItem({ data: vars }),
    onSuccess: () => {
      toast.success("Removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (vars: { kind: "media" | "merch" | "project" | "blog"; id: string; is_published: boolean }) =>
      togglePublished({ data: vars }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  // ---- media form state
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaDesc, setMediaDesc] = useState("");
  const [mediaDate, setMediaDate] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function submitMedia(e: React.FormEvent) {
    e.preventDefault();
    if (!mediaFile) {
      toast.error("Choose an image or video");
      return;
    }
    if (mediaFile.size > MAX_UPLOAD_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_UPLOAD_MB}MB`);
      return;
    }
    const isVideo = mediaFile.type.startsWith("video/");
    if (!isVideo && !mediaFile.type.startsWith("image/")) {
      toast.error("Only images and videos are allowed");
      return;
    }

    setUploading(true);
    try {
      const ext = mediaFile.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `events/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage
        .from("media")
        .upload(path, mediaFile, { contentType: mediaFile.type, upsert: false });
      if (up.error) throw new Error(up.error.message);
      const signed = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24);

      await addMedia({
        data: {
          title: mediaTitle,
          description: mediaDesc,
          media_type: isVideo ? "video" : "image",
          url: signed.data?.signedUrl ?? path,
          storage_path: path,
          event_date: mediaDate || null,
          is_published: true,
        },
      });
      toast.success("Uploaded to the gallery");
      setMediaTitle("");
      setMediaDesc("");
      setMediaDate("");
      setMediaFile(null);
      (document.getElementById("media-file") as HTMLInputElement | null)?.value &&
        ((document.getElementById("media-file") as HTMLInputElement).value = "");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // ---- merch form state
  const [merchName, setMerchName] = useState("");
  const [merchDesc, setMerchDesc] = useState("");
  const [merchPrice, setMerchPrice] = useState("");
  const [merchImage, setMerchImage] = useState("");
  const [merchLink, setMerchLink] = useState("");
  const [merchUntil, setMerchUntil] = useState("");

  const merchMutation = useMutation({
    mutationFn: () =>
      addMerch({
        data: {
          name: merchName,
          description: merchDesc,
          price: merchPrice ? Number(merchPrice) : null,
          currency: "NGN",
          image_url: merchImage || null,
          preorder_url: merchLink,
          available_until: merchUntil || null,
          is_published: true,
        },
      }),
    onSuccess: () => {
      toast.success("Pre-order link published");
      setMerchName("");
      setMerchDesc("");
      setMerchPrice("");
      setMerchImage("");
      setMerchLink("");
      setMerchUntil("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ---- project form state
  const [projTitle, setProjTitle] = useState("");
  const [projSummary, setProjSummary] = useState("");
  const [projAuthor, setProjAuthor] = useState("");
  const [projTools, setProjTools] = useState("");
  const [projImage, setProjImage] = useState("");
  const [projUrl, setProjUrl] = useState("");

  const projectMutation = useMutation({
    mutationFn: () =>
      addProject({
        data: {
          title: projTitle,
          summary: projSummary,
          author_name: projAuthor || null,
          tools: projTools
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          image_url: projImage || null,
          project_url: projUrl,
          is_published: true,
        },
      }),
    onSuccess: () => {
      toast.success("Project published");
      setProjTitle("");
      setProjSummary("");
      setProjAuthor("");
      setProjTools("");
      setProjImage("");
      setProjUrl("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!loading && user && !isStaff) {
    return (
      <SiteLayout>
        <PageHero eyebrow="Restricted" title="Staff only" lead="This area is for staff accounts." />
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Content studio"
        title="Gallery, merch & projects"
        lead="Upload event media, open merch pre-orders and publish student project showcases."
      >
        <Button asChild variant="outline" className="mt-8">
          <Link to="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to admin console
          </Link>
        </Button>
      </PageHero>

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-14">
        {/* MEDIA */}
        <section className="rounded-3xl border border-border bg-card p-7">
          <h2 className="inline-flex items-center gap-3 font-display text-xl font-bold uppercase">
            <Images className="h-5 w-5 text-primary-glow" /> Event media
          </h2>
          <form onSubmit={submitMedia} className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="media-title">Title</Label>
              <Input
                id="media-title"
                value={mediaTitle}
                onChange={(e) => setMediaTitle(e.target.value)}
                maxLength={140}
                required
                placeholder="Cohort 3 graduation"
              />
            </div>
            <div>
              <Label htmlFor="media-date">Event date</Label>
              <Input
                id="media-date"
                type="date"
                value={mediaDate}
                onChange={(e) => setMediaDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="media-desc">Caption</Label>
              <Textarea
                id="media-desc"
                value={mediaDesc}
                onChange={(e) => setMediaDesc(e.target.value)}
                maxLength={600}
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="media-file">Image or video (max {MAX_UPLOAD_MB}MB)</Label>
              <Input
                id="media-file"
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
            <div>
              <Button type="submit" disabled={uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload to gallery
              </Button>
            </div>
          </form>

          <ItemList
            loading={isLoading}
            items={(data?.media ?? []).map((m) => ({
              id: m.id,
              label: m.title,
              meta: m.media_type,
              published: m.is_published,
            }))}
            kind="media"
            onDelete={(id) => deleteMutation.mutate({ kind: "media", id })}
            onToggle={(id, pub) => toggleMutation.mutate({ kind: "media", id, is_published: pub })}
          />
        </section>

        {/* MERCH */}
        <section className="rounded-3xl border border-border bg-card p-7">
          <h2 className="inline-flex items-center gap-3 font-display text-xl font-bold uppercase">
            <ShoppingBag className="h-5 w-5 text-primary-glow" /> Merch pre-orders
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              merchMutation.mutate();
            }}
            className="mt-6 grid gap-4 md:grid-cols-2"
          >
            <div>
              <Label htmlFor="merch-name">Product name</Label>
              <Input
                id="merch-name"
                value={merchName}
                onChange={(e) => setMerchName(e.target.value)}
                required
                maxLength={140}
                placeholder="Synalyx hoodie"
              />
            </div>
            <div>
              <Label htmlFor="merch-price">Price (NGN)</Label>
              <Input
                id="merch-price"
                type="number"
                min={0}
                value={merchPrice}
                onChange={(e) => setMerchPrice(e.target.value)}
                placeholder="18000"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="merch-desc">Description</Label>
              <Textarea
                id="merch-desc"
                value={merchDesc}
                onChange={(e) => setMerchDesc(e.target.value)}
                rows={2}
                maxLength={800}
              />
            </div>
            <div>
              <Label htmlFor="merch-link">Pre-order link (https)</Label>
              <Input
                id="merch-link"
                type="url"
                value={merchLink}
                onChange={(e) => setMerchLink(e.target.value)}
                required
                placeholder="https://forms.gle/..."
              />
            </div>
            <div>
              <Label htmlFor="merch-image">Image URL (https)</Label>
              <Input
                id="merch-image"
                type="url"
                value={merchImage}
                onChange={(e) => setMerchImage(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="merch-until">Pre-order closes</Label>
              <Input
                id="merch-until"
                type="date"
                value={merchUntil}
                onChange={(e) => setMerchUntil(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={merchMutation.isPending}>
                {merchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish pre-order
              </Button>
            </div>
          </form>

          <ItemList
            loading={isLoading}
            items={(data?.merch ?? []).map((m) => ({
              id: m.id,
              label: m.name,
              meta: m.preorder_url ?? "",
              published: m.is_published,
            }))}
            kind="merch"
            onDelete={(id) => deleteMutation.mutate({ kind: "merch", id })}
            onToggle={(id, pub) => toggleMutation.mutate({ kind: "merch", id, is_published: pub })}
          />
        </section>

        {/* PROJECTS */}
        <section className="rounded-3xl border border-border bg-card p-7">
          <h2 className="inline-flex items-center gap-3 font-display text-xl font-bold uppercase">
            <Sparkles className="h-5 w-5 text-primary-glow" /> Project showcase
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              projectMutation.mutate();
            }}
            className="mt-6 grid gap-4 md:grid-cols-2"
          >
            <div>
              <Label htmlFor="proj-title">Project title</Label>
              <Input
                id="proj-title"
                value={projTitle}
                onChange={(e) => setProjTitle(e.target.value)}
                required
                maxLength={160}
              />
            </div>
            <div>
              <Label htmlFor="proj-author">Student / author</Label>
              <Input
                id="proj-author"
                value={projAuthor}
                onChange={(e) => setProjAuthor(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="proj-summary">Summary</Label>
              <Textarea
                id="proj-summary"
                value={projSummary}
                onChange={(e) => setProjSummary(e.target.value)}
                rows={3}
                maxLength={1200}
              />
            </div>
            <div>
              <Label htmlFor="proj-tools">Tools (comma separated)</Label>
              <Input
                id="proj-tools"
                value={projTools}
                onChange={(e) => setProjTools(e.target.value)}
                placeholder="Power BI, SQL"
              />
            </div>
            <div>
              <Label htmlFor="proj-image">Cover image URL (https)</Label>
              <Input
                id="proj-image"
                type="url"
                value={projImage}
                onChange={(e) => setProjImage(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="proj-url">Project link (https)</Label>
              <Input
                id="proj-url"
                type="url"
                value={projUrl}
                onChange={(e) => setProjUrl(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={projectMutation.isPending}>
                {projectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish project
              </Button>
            </div>
          </form>

          <ItemList
            loading={isLoading}
            items={(data?.projects ?? []).map((p) => ({
              id: p.id,
              label: p.title,
              meta: p.author_name ?? "",
              published: p.is_published,
            }))}
            kind="project"
            onDelete={(id) => deleteMutation.mutate({ kind: "project", id })}
            onToggle={(id, pub) => toggleMutation.mutate({ kind: "project", id, is_published: pub })}
          />
        </section>
      </div>
    </SiteLayout>
  );
}

function ItemList({
  loading,
  items,
  onDelete,
  onToggle,
}: {
  loading: boolean;
  items: { id: string; label: string; meta: string; published: boolean }[];
  kind: "media" | "merch" | "project" | "blog";
  onDelete: (id: string) => void;
  onToggle: (id: string, isPublished: boolean) => void;
}) {
  if (loading) return <p className="mt-6 text-sm text-muted-foreground">Loading…</p>;
  if (items.length === 0)
    return <p className="mt-6 text-sm text-muted-foreground">Nothing published yet.</p>;

  return (
    <ul className="mt-7 divide-y divide-border/60 border-t border-border/60">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.label}</p>
            <p className="truncate text-xs text-muted-foreground">{item.meta}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onToggle(item.id, !item.published)}
              aria-label={item.published ? "Unpublish" : "Publish"}
            >
              {item.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item.id)}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
