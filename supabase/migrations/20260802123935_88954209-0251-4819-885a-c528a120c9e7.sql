-- SITE SETTINGS -----------------------------------------------------------
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  brand_name text NOT NULL DEFAULT 'SYNALYX',
  tagline text NOT NULL DEFAULT 'Synchronized data, Simplified decisions',
  logo_url text,
  accent text NOT NULL DEFAULT 'indigo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton_check CHECK (singleton)
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_settings_public_read ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY site_settings_admin_insert ON public.site_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY site_settings_admin_update ON public.site_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (singleton) VALUES (true);

-- NOTIFICATIONS ------------------------------------------------------------
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'info',
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY notifications_staff_insert ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ASSIGNMENT SUBMISSION LINKS ---------------------------------------------
ALTER TABLE public.assignments
  ADD COLUMN submit_token text NOT NULL DEFAULT encode(gen_random_bytes(9), 'hex'),
  ADD COLUMN allowed_formats text[] NOT NULL DEFAULT ARRAY['pdf','xlsx','csv']::text[],
  ADD COLUMN max_file_mb integer NOT NULL DEFAULT 15,
  ADD COLUMN accepts_link boolean NOT NULL DEFAULT true,
  ADD COLUMN is_open boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX assignments_submit_token_key ON public.assignments (submit_token);

-- ANNOUNCEMENT FAN-OUT -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.fanout_announcement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.cohort_id IS NULL THEN
    INSERT INTO public.notifications (user_id, title, body, kind, link)
    SELECT p.id, NEW.title, NEW.body, 'announcement', '/dashboard'
    FROM public.profiles p;
  ELSE
    INSERT INTO public.notifications (user_id, title, body, kind, link)
    SELECT e.student_id, NEW.title, NEW.body, 'announcement', '/dashboard'
    FROM public.enrollments e
    WHERE e.cohort_id = NEW.cohort_id AND e.status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fanout_announcement() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER announcements_fanout
AFTER INSERT ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.fanout_announcement();

-- updated_at maintenance ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER site_settings_touch
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();