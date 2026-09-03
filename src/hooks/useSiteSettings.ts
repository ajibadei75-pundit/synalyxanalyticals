import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  brand_name: string;
  tagline: string;
  logo_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  x_url: string | null;
  whatsapp_url: string | null;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    staleTime: 60_000,
    queryFn: async (): Promise<SiteSettings> => {
      const { data } = await supabase
        .from("site_settings_public")
        .select("brand_name, tagline, logo_url, instagram_url, facebook_url, linkedin_url, youtube_url, x_url, whatsapp_url")
        .limit(1)
        .maybeSingle();
      return {
        brand_name: data?.brand_name ?? "SYNALYX",
        tagline: data?.tagline ?? "Synchronized data, Simplified decisions",
        logo_url: data?.logo_url ?? null,
        instagram_url: data?.instagram_url ?? null,
        facebook_url: data?.facebook_url ?? null,
        linkedin_url: data?.linkedin_url ?? null,
        youtube_url: data?.youtube_url ?? null,
        x_url: data?.x_url ?? null,
        whatsapp_url: data?.whatsapp_url ?? null,
      };
    },
  });
}
