import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { serverPublicClient } from "@/lib/public-client";
import { mediaSchema, merchSchema, projectSchema } from "@/lib/content.schemas";

export const listGallery = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("media_items")
    .select("id, title, description, media_type, url, storage_path, event_date, created_at")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(120);
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const signed = await Promise.all(
    rows.map(async (row) => {
      if (!row.storage_path) return row;
      const { data: link } = await supabase.storage
        .from("media")
        .createSignedUrl(row.storage_path, 60 * 60 * 24);
      return { ...row, url: link?.signedUrl ?? row.url };
    }),
  );
  return signed;
});

export const listMerch = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("merch_items")
    .select("id, name, description, price, currency, image_url, preorder_url, available_until")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("showcase_projects")
    .select("id, title, summary, author_name, tools, image_url, project_url, created_at")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listContentAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Forbidden");

    const [media, merch, projects] = await Promise.all([
      supabase.from("media_items").select("*").order("created_at", { ascending: false }),
      supabase.from("merch_items").select("*").order("created_at", { ascending: false }),
      supabase.from("showcase_projects").select("*").order("created_at", { ascending: false }),
    ]);
    return {
      media: media.data ?? [],
      merch: merch.data ?? [],
      projects: projects.data ?? [],
    };
  });

export const createMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => mediaSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Forbidden");
    const { error } = await supabase.from("media_items").insert({
      title: data.title,
      description: data.description,
      media_type: data.media_type,
      url: data.url,
      storage_path: data.storage_path,
      event_date: data.event_date || null,
      is_published: data.is_published,
      created_by: userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const createMerch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => merchSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Forbidden");
    const { error } = await supabase.from("merch_items").insert({
      name: data.name,
      description: data.description,
      price: data.price,
      currency: data.currency,
      image_url: data.image_url,
      preorder_url: data.preorder_url,
      available_until: data.available_until || null,
      is_published: data.is_published,
      created_by: userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => projectSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Forbidden");
    const { error } = await supabase.from("showcase_projects").insert({
      title: data.title,
      summary: data.summary,
      author_name: data.author_name,
      tools: data.tools,
      image_url: data.image_url,
      project_url: data.project_url || null,
      is_published: data.is_published,
      created_by: userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteContentItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { kind: "media" | "merch" | "project"; id: string }) => ({
    kind: data.kind,
    id: String(data.id),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Forbidden");
    const table =
      data.kind === "media"
        ? "media_items"
        : data.kind === "merch"
          ? "merch_items"
          : "showcase_projects";
    const { error } = await supabase.from(table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const toggleContentPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { kind: "media" | "merch" | "project"; id: string; is_published: boolean }) => ({
    kind: data.kind,
    id: String(data.id),
    is_published: Boolean(data.is_published),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Forbidden");
    const table =
      data.kind === "media"
        ? "media_items"
        : data.kind === "merch"
          ? "merch_items"
          : "showcase_projects";
    const { error } = await supabase
      .from(table)
      .update({ is_published: data.is_published })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
