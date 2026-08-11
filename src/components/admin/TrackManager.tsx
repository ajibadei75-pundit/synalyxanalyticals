import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Eye, EyeOff, GraduationCap, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteTrack,
  listTracksAdmin,
  saveTrack,
  toggleTrack,
} from "@/lib/tracks.functions";
import type { TrackInput } from "@/lib/tracks.schemas";

type TrackRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  level: string;
  duration_weeks: number;
  fee: number;
  outline: string[] | null;
  sort_order: number;
  is_active: boolean;
};

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Career track"];

const emptyForm: TrackInput = {
  id: null,
  title: "",
  slug: "",
  summary: "",
  description: "",
  level: "Beginner",
  duration_weeks: 8,
  fee: 0,
  outline: [],
  sort_order: 0,
  is_active: true,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

export function TrackManager() {
  const queryClient = useQueryClient();
  const load = useServerFn(listTracksAdmin);
  const persist = useServerFn(saveTrack);
  const remove = useServerFn(deleteTrack);
  const publish = useServerFn(toggleTrack);

  const [form, setForm] = useState<TrackInput>(emptyForm);
  const [outlineDraft, setOutlineDraft] = useState("");
  const [editing, setEditing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tracks"],
    queryFn: () => load() as Promise<TrackRow[]>,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-tracks"] });
    queryClient.invalidateQueries({ queryKey: ["public", "courses"] });
  };

  const saveMutation = useMutation({
    mutationFn: () => persist({ data: form }),
    onSuccess: () => {
      toast.success(form.id ? "Track updated" : "Track published");
      setForm(emptyForm);
      setEditing(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Track deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) => publish({ data: v }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof TrackInput>(key: K, value: TrackInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const startEdit = (t: TrackRow) => {
    setForm({
      id: t.id,
      title: t.title,
      slug: t.slug,
      summary: t.summary,
      description: t.description ?? "",
      level: t.level,
      duration_weeks: t.duration_weeks,
      fee: Number(t.fee ?? 0),
      outline: Array.isArray(t.outline) ? t.outline : [],
      sort_order: t.sort_order,
      is_active: t.is_active,
    });
    setEditing(true);
    window.scrollTo({ top: window.scrollY, behavior: "smooth" });
  };

  const addOutline = () => {
    const value = outlineDraft.trim();
    if (value.length < 2) return;
    set("outline", [...form.outline, value].slice(0, 40));
    setOutlineDraft("");
  };

  const tracks = data ?? [];

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <form
        className="rounded-3xl border border-border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
      >
        <h3 className="inline-flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight">
          <GraduationCap className="h-5 w-5 text-primary-glow" />
          {editing ? "Edit track" : "Add a track you teach"}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Tracks appear instantly on the public Courses page with their outline, duration and fee.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="track-title">Track title</Label>
            <Input
              id="track-title"
              value={form.title}
              maxLength={140}
              required
              onChange={(e) => {
                const title = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  title,
                  slug: prev.id ? prev.slug : slugify(title),
                }));
              }}
              placeholder="Power BI for business reporting"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="track-slug">Page link (slug)</Label>
              <Input
                id="track-slug"
                value={form.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
                placeholder="power-bi"
                required
              />
            </div>
            <div>
              <Label htmlFor="track-level">Level</Label>
              <select
                id="track-level"
                value={form.level}
                onChange={(e) => set("level", e.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="track-summary">Short summary</Label>
            <Textarea
              id="track-summary"
              value={form.summary}
              rows={2}
              maxLength={400}
              required
              onChange={(e) => set("summary", e.target.value)}
              placeholder="Build dashboards decision-makers actually use."
            />
          </div>

          <div>
            <Label htmlFor="track-description">Full description</Label>
            <Textarea
              id="track-description"
              value={form.description}
              rows={4}
              maxLength={2000}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What students will be able to do at the end of the track."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="track-weeks">Weeks</Label>
              <Input
                id="track-weeks"
                type="number"
                min={1}
                max={104}
                value={form.duration_weeks}
                onChange={(e) => set("duration_weeks", Number(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="track-fee">Fee (NGN)</Label>
              <Input
                id="track-fee"
                type="number"
                min={0}
                step={1000}
                value={form.fee}
                onChange={(e) => set("fee", Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="track-order">Order</Label>
              <Input
                id="track-order"
                type="number"
                min={0}
                max={999}
                value={form.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="track-outline">Curriculum outline</Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="track-outline"
                value={outlineDraft}
                onChange={(e) => setOutlineDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOutline();
                  }
                }}
                placeholder="Week 1 — Data modelling fundamentals"
              />
              <Button type="button" variant="secondary" onClick={addOutline}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {form.outline.length > 0 && (
              <ul className="mt-3 space-y-2">
                {form.outline.map((item, i) => (
                  <li
                    key={`${item}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{item}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${item}`}
                      onClick={() =>
                        set(
                          "outline",
                          form.outline.filter((_, idx) => idx !== i),
                        )
                      }
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Show this track publicly
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Publish track"}
          </Button>
          {editing && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setForm(emptyForm);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-3xl border border-border bg-card" />
        ) : tracks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No tracks yet — add the first one on the left.
          </div>
        ) : (
          tracks.map((t) => (
            <article key={t.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-display text-base font-bold uppercase tracking-tight">
                    {t.title}
                  </h4>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {t.level} · {t.duration_weeks} weeks ·{" "}
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                      maximumFractionDigits: 0,
                    }).format(Number(t.fee ?? 0))}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleMutation.mutate({ id: t.id, is_active: !t.is_active })}
                    aria-label={t.is_active ? "Hide track" : "Show track"}
                  >
                    {t.is_active ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(t)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(t.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{t.summary}</p>
              {Array.isArray(t.outline) && t.outline.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {t.outline.slice(0, 6).map((o, i) => (
                    <li
                      key={`${t.id}-${i}`}
                      className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {o}
                    </li>
                  ))}
                  {t.outline.length > 6 && (
                    <li className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                      +{t.outline.length - 6} more
                    </li>
                  )}
                </ul>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
