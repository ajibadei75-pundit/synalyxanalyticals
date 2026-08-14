alter view public.reviews_public set (security_invoker = on);
drop view if exists public.site_settings_public;

create policy "Anon reads public review columns" on public.reviews
  for select to anon using (true);
grant select (id, target_type, target_id, author_name, rating, comment, created_at, updated_at)
  on public.reviews to anon;

create policy site_settings_public_read on public.site_settings
  for select to anon using (true);
grant select (brand_name, tagline, logo_url, accent) on public.site_settings to anon;