import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  brand_name: string;
  tagline: string;
  logo_url: string | null;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    staleTime: 60_000,
    queryFn: async (): Promise<SiteSettings> => {
      const { data } = await supabase
        .from("site_settings")
        .select("brand_name, tagline, logo_url")
        .limit(1)
        .maybeSingle();
      return (
        data ?? {
          brand_name: "SYNALYX",
          tagline: "Synchronized data, Simplified decisions",
          logo_url: null,
        }
      );
    },
  });
}
