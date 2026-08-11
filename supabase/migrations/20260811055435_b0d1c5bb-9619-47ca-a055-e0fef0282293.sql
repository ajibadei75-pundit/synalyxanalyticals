ALTER VIEW public.reviews_public SET (security_invoker = on);

REVOKE SELECT ON public.reviews FROM anon;
REVOKE SELECT ON public.reviews FROM authenticated;

GRANT SELECT (id, target_type, target_id, author_name, rating, comment, created_at, updated_at)
  ON public.reviews TO anon, authenticated;
GRANT SELECT (user_id) ON public.reviews TO authenticated;

CREATE POLICY "Public can read review content"
  ON public.reviews FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Owners and staff read reviews" ON public.reviews;
CREATE POLICY "Signed-in users read reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);