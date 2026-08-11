-- 1. Hide reviewer identity from the public
DROP POLICY IF EXISTS "Reviews are public" ON public.reviews;

CREATE POLICY "Owners and staff read reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE OR REPLACE VIEW public.reviews_public AS
  SELECT id, target_type, target_id, author_name, rating, comment, created_at, updated_at
  FROM public.reviews;

GRANT SELECT ON public.reviews_public TO anon, authenticated;

-- 2. Trigger / internal functions must not be callable through the API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fanout_announcement() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated;