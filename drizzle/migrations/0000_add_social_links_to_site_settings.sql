ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS x_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_url text;

DROP VIEW IF EXISTS public.site_settings_public;

CREATE VIEW public.site_settings_public
WITH (security_invoker = off) AS
  SELECT brand_name, tagline, logo_url, accent,
    instagram_url, facebook_url, linkedin_url, youtube_url, x_url, whatsapp_url
  FROM public.site_settings;

ALTER VIEW public.site_settings_public OWNER TO postgres;
REVOKE ALL ON public.site_settings_public FROM public;
GRANT SELECT ON public.site_settings_public TO anon, authenticated;

GRANT UPDATE (brand_name, tagline, logo_url, instagram_url, facebook_url, linkedin_url, youtube_url, x_url, whatsapp_url)
  ON public.site_settings TO authenticated;