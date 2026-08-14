create policy site_settings_authenticated_read on public.site_settings
  for select to authenticated using (true);
drop policy if exists site_settings_staff_read on public.site_settings;
revoke select on public.site_settings from authenticated;
grant select (id, singleton, brand_name, tagline, logo_url, accent, created_at, updated_at)
  on public.site_settings to authenticated;