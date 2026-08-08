CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  cover_image_url text,
  category text NOT NULL DEFAULT 'Insights',
  author_name text NOT NULL DEFAULT 'Synalyx Analyticals',
  read_minutes integer NOT NULL DEFAULT 4,
  tags text[] NOT NULL DEFAULT '{}',
  body jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  view_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are public" ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (is_published = true OR public.is_staff(auth.uid()));
CREATE POLICY "Staff insert posts" ON public.blog_posts
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update posts" ON public.blog_posts
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete posts" ON public.blog_posts
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER blog_posts_touch BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX blog_posts_published_idx ON public.blog_posts (is_published, published_at DESC);

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('media','merch','project','blog')),
  target_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_type, target_id, user_id)
);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are public" ON public.reviews
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users add own review" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users edit own review" ON public.reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users or staff remove review" ON public.reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE TRIGGER reviews_touch BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX reviews_target_idx ON public.reviews (target_type, target_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.increment_blog_view(_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.blog_posts SET view_count = view_count + 1
  WHERE slug = _slug AND is_published = true;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_blog_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_blog_view(text) TO anon, authenticated, service_role;