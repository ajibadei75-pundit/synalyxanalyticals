-- 1. Security fix: restrict application inserts so they cannot be linked to another account
DROP POLICY IF EXISTS applications_public_insert ON public.applications;
CREATE POLICY applications_public_insert ON public.applications
  FOR INSERT
  WITH CHECK (status = 'pending'::application_status AND student_id IS NULL);

-- 2. Security fix: trigger-only SECURITY DEFINER functions must not be callable by clients
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fanout_announcement() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- 3. Event gallery (images + videos)
CREATE TABLE public.media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  media_type text NOT NULL DEFAULT 'image',
  url text NOT NULL,
  storage_path text,
  event_date date,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_items TO authenticated;
GRANT ALL ON public.media_items TO service_role;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY media_public_read ON public.media_items FOR SELECT USING (is_published = true OR public.is_staff(auth.uid()));
CREATE POLICY media_staff_insert ON public.media_items FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY media_staff_update ON public.media_items FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY media_staff_delete ON public.media_items FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER media_items_touch BEFORE UPDATE ON public.media_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Merch with pre-order links
CREATE TABLE public.merch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2),
  currency text NOT NULL DEFAULT 'NGN',
  image_url text,
  preorder_url text,
  available_until date,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.merch_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merch_items TO authenticated;
GRANT ALL ON public.merch_items TO service_role;
ALTER TABLE public.merch_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY merch_public_read ON public.merch_items FOR SELECT USING (is_published = true OR public.is_staff(auth.uid()));
CREATE POLICY merch_staff_insert ON public.merch_items FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY merch_staff_update ON public.merch_items FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY merch_staff_delete ON public.merch_items FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER merch_items_touch BEFORE UPDATE ON public.merch_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. Showcase projects
CREATE TABLE public.showcase_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  author_name text,
  tools text[] NOT NULL DEFAULT '{}',
  image_url text,
  project_url text,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.showcase_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.showcase_projects TO authenticated;
GRANT ALL ON public.showcase_projects TO service_role;
ALTER TABLE public.showcase_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_public_read ON public.showcase_projects FOR SELECT USING (is_published = true OR public.is_staff(auth.uid()));
CREATE POLICY projects_staff_insert ON public.showcase_projects FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY projects_staff_update ON public.showcase_projects FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY projects_staff_delete ON public.showcase_projects FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER showcase_projects_touch BEFORE UPDATE ON public.showcase_projects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. Storage policies for the media bucket (private bucket, readable via signed URLs)
CREATE POLICY media_bucket_read ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY media_bucket_staff_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.is_staff(auth.uid()));
CREATE POLICY media_bucket_staff_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.is_staff(auth.uid()));
CREATE POLICY media_bucket_staff_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.is_staff(auth.uid()));