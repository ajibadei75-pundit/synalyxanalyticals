import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { trackSchema } from "@/lib/tracks.schemas";


export const listTracksAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!staff) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("courses")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => trackSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only an admin can manage tracks");

    const row = {
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      description: data.description || data.summary,
      level: data.level,
      duration_weeks: data.duration_weeks,
      fee: data.fee,
      outline: data.outline,
      sort_order: data.sort_order,
      is_active: data.is_active,
    };

    const query = data.id
      ? supabase.from("courses").update(row).eq("id", data.id)
      : supabase.from("courses").insert(row);
    const { error } = await query;
    if (error) {
      throw new Error(
        error.code === "23505" ? "That track link (slug) is already used" : error.message,
      );
    }
    return { ok: true as const };
  });

export const deleteTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only an admin can manage tracks");
    const { error } = await supabase.from("courses").delete().eq("id", data.id);
    if (error) {
      throw new Error(
        error.code === "23503"
          ? "This track has cohorts attached — archive it instead of deleting."
          : error.message,
      );
    }
    return { ok: true as const };
  });

export const toggleTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; is_active: boolean }) => ({
    id: String(data.id),
    is_active: Boolean(data.is_active),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only an admin can manage tracks");
    const { error } = await supabase
      .from("courses")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
