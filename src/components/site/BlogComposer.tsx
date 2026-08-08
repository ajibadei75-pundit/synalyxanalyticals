import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBlogPost } from "@/lib/content.functions";
import type { BlogBlock } from "@/lib/content.schemas";

type Draft = {
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string;
  category: string;
  author_name: string;
  read_minutes: number;
  tags: string;
  body: BlogBlock[];
};

const emptyDraft: Draft = {
  title: "",
  slug: "",
  excerpt: "",
  cover_image_url: "",
  category: "Insights",
  author_name: "Synalyx Analyticals",
  read_minutes: 4,
  tags: "",
  body: [{ type: "paragraph", text: "" }],
};

const TEMPLATES: { name: string; description: string; build: () => Partial<Draft> }[] = [
  {
    name: "Tutorial",
    description: "Step-by-step walkthrough with tools list and takeaway",
    build: () => ({
      category: "Tutorial",
      read_minutes: 7,
      body: [
        { type: "paragraph", text: "What you'll build in this tutorial and why it matters." },
        { type: "heading", text: "What you need" },
        { type: "list", items: ["Excel or Power BI", "The sample dataset", "30 focused minutes"] },
        { type: "heading", text: "Step 1 — Load and inspect the data" },
        { type: "paragraph", text: "Describe the first step in plain language." },
        { type: "heading", text: "Step 2 — Clean and model" },
        { type: "paragraph", text: "Describe the transformation and why it is needed." },
        { type: "quote", text: "Clean data beats clever formulas every single time." },
        { type: "heading", text: "Takeaway" },
        { type: "paragraph", text: "Summarise the result and the next thing to practise." },
      ],
    }),
  },
  {
    name: "Career guide",
    description: "Advice piece with checklist and closing call to action",
    build: () => ({
      category: "Career",
      read_minutes: 6,
      body: [
        { type: "paragraph", text: "Who this guide is for and the problem it solves." },
        { type: "heading", text: "The market right now" },
        { type: "paragraph", text: "Context on hiring, tools and expectations." },
        { type: "heading", text: "Your 5-step checklist" },
        {
          type: "list",
          items: [
            "Pick one tool and go deep",
            "Ship three portfolio projects",
            "Write about your analysis",
            "Practise stakeholder questions",
            "Apply with a targeted CV",
          ],
        },
        { type: "quote", text: "Employers hire evidence, not intentions." },
        { type: "heading", text: "Next step" },
        { type: "paragraph", text: "Point the reader to a cohort or resource." },
      ],
    }),
  },
  {
    name: "Event recap",
    description: "Recap with photos, highlights and thanks",
    build: () => ({
      category: "Events",
      read_minutes: 4,
      body: [
        { type: "paragraph", text: "Where the event happened, who came and the vibe." },
        { type: "heading", text: "Highlights" },
        { type: "list", items: ["Session one", "Session two", "Student showcase"] },
        { type: "quote", text: "A quote from a student or facilitator." },
        { type: "heading", text: "What's next" },
        { type: "paragraph", text: "Tease the next cohort or event." },
      ],
    }),
  },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

export function BlogComposer({ onPublished }: { onPublished: () => void }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const publish = useServerFn(createBlogPost);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setBlock = (index: number, block: BlogBlock) =>
    setDraft((d) => ({ ...d, body: d.body.map((b, i) => (i === index ? block : b)) }));

  const addBlock = (type: BlogBlock["type"]) =>
    setDraft((d) => ({
      ...d,
      body: [
        ...d.body,
        type === "list"
          ? { type: "list", items: [""] }
          : type === "image"
            ? { type: "image", url: "", caption: "" }
            : { type, text: "" },
      ],
    }));

  const moveBlock = (index: number, dir: -1 | 1) =>
    setDraft((d) => {
      const next = [...d.body];
      const target = index + dir;
      if (target < 0 || target >= next.length) return d;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return { ...d, body: next };
    });

  const removeBlock = (index: number) =>
    setDraft((d) => ({ ...d, body: d.body.filter((_, i) => i !== index) }));

  const mutation = useMutation({
    mutationFn: () =>
      publish({
        data: {
          title: draft.title,
          slug: draft.slug || slugify(draft.title),
          excerpt: draft.excerpt,
          cover_image_url: draft.cover_image_url,
          category: draft.category,
          author_name: draft.author_name,
          read_minutes: Number(draft.read_minutes) || 4,
          tags: draft.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          body: draft.body,
          is_published: true,
        },
      }),
    onSuccess: () => {
      toast.success("Article published");
      setDraft(emptyDraft);
      onPublished();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="mt-6 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Start from a template
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => setDraft((d) => ({ ...d, ...t.build() }))}
              className="rounded-2xl border border-border bg-secondary/50 p-4 text-left transition-colors hover:border-primary/60"
            >
              <span className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase">
                <Wand2 className="h-4 w-4 text-primary-glow" /> {t.name}
              </span>
              <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
                {t.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="blog-title">Title</Label>
          <Input
            id="blog-title"
            value={draft.title}
            required
            maxLength={160}
            onChange={(e) => {
              const value = e.target.value;
              setDraft((d) => ({
                ...d,
                title: value,
                slug: d.slug && d.slug !== slugify(d.title) ? d.slug : slugify(value),
              }));
            }}
            placeholder="Build your first Power BI dashboard"
          />
        </div>
        <div>
          <Label htmlFor="blog-slug">URL slug</Label>
          <Input
            id="blog-slug"
            value={draft.slug}
            required
            onChange={(e) => set("slug", slugify(e.target.value))}
            placeholder="build-your-first-dashboard"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="blog-excerpt">Excerpt</Label>
          <Textarea
            id="blog-excerpt"
            rows={2}
            maxLength={400}
            value={draft.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="blog-category">Category</Label>
          <Input
            id="blog-category"
            value={draft.category}
            onChange={(e) => set("category", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="blog-author">Author</Label>
          <Input
            id="blog-author"
            value={draft.author_name}
            onChange={(e) => set("author_name", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="blog-read">Read time (minutes)</Label>
          <Input
            id="blog-read"
            type="number"
            min={1}
            max={90}
            value={draft.read_minutes}
            onChange={(e) => set("read_minutes", Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="blog-tags">Tags (comma separated)</Label>
          <Input
            id="blog-tags"
            value={draft.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="power bi, dashboards"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="blog-cover">Cover image URL (https)</Label>
          <Input
            id="blog-cover"
            type="url"
            value={draft.cover_image_url}
            onChange={(e) => set("cover_image_url", e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Article sections</p>
        {draft.body.map((block, i) => (
          <div key={i} className="rounded-2xl border border-border bg-secondary/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary-glow">
                {block.type}
              </span>
              <div className="flex items-center gap-1">
                <Button type="button" size="sm" variant="ghost" onClick={() => moveBlock(i, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => moveBlock(i, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => removeBlock(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            {block.type === "list" ? (
              <div className="mt-3 space-y-2">
                {block.items.map((item, j) => (
                  <Input
                    key={j}
                    value={item}
                    placeholder={`Point ${j + 1}`}
                    onChange={(e) =>
                      setBlock(i, {
                        type: "list",
                        items: block.items.map((it, k) => (k === j ? e.target.value : it)),
                      })
                    }
                  />
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setBlock(i, { type: "list", items: [...block.items, ""] })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add point
                </Button>
              </div>
            ) : block.type === "image" ? (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input
                  type="url"
                  value={block.url}
                  placeholder="https://image-url"
                  onChange={(e) => setBlock(i, { ...block, url: e.target.value })}
                />
                <Input
                  value={block.caption}
                  placeholder="Caption"
                  onChange={(e) => setBlock(i, { ...block, caption: e.target.value })}
                />
              </div>
            ) : (
              <Textarea
                className="mt-3"
                rows={block.type === "paragraph" ? 4 : 2}
                value={block.text}
                placeholder={
                  block.type === "heading"
                    ? "Section heading"
                    : block.type === "quote"
                      ? "A memorable quote"
                      : "Write the paragraph…"
                }
                onChange={(e) => setBlock(i, { ...block, text: e.target.value })}
              />
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          {(["heading", "paragraph", "quote", "list", "image"] as const).map((t) => (
            <Button key={t} type="button" size="sm" variant="outline" onClick={() => addBlock(t)}>
              <Plus className="mr-2 h-4 w-4" /> {t}
            </Button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Publish article
      </Button>
    </form>
  );
}
