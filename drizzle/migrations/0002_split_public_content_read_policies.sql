DROP POLICY IF EXISTS media_public_read ON public.media_items;
CREATE POLICY media_public_read ON public.media_items
  FOR SELECT TO anon USING (is_published = true);
CREATE POLICY media_authenticated_read ON public.media_items
  FOR SELECT TO authenticated USING (is_published = true OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS merch_public_read ON public.merch_items;
CREATE POLICY merch_public_read ON public.merch_items
  FOR SELECT TO anon USING (is_published = true);
CREATE POLICY merch_authenticated_read ON public.merch_items
  FOR SELECT TO authenticated USING (is_published = true OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS projects_public_read ON public.showcase_projects;
CREATE POLICY projects_public_read ON public.showcase_projects
  FOR SELECT TO anon USING (is_published = true);
CREATE POLICY projects_authenticated_read ON public.showcase_projects
  FOR SELECT TO authenticated USING (is_published = true OR public.is_staff(auth.uid()));