create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select (auth.uid() is null or _user_id = auth.uid())
     and exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select (auth.uid() is null or _user_id = auth.uid())
     and exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','instructor'));
$$;

create or replace function public.is_in_cohort(_user_id uuid, _cohort_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select (auth.uid() is null or _user_id = auth.uid())
     and exists (select 1 from public.enrollments where student_id = _user_id and cohort_id = _cohort_id and status = 'active');
$$;

revoke all on function public.has_role(uuid, app_role) from public, anon;
revoke all on function public.is_staff(uuid) from public, anon;
revoke all on function public.is_in_cohort(uuid, uuid) from public, anon;
grant execute on function public.has_role(uuid, app_role) to authenticated, service_role;
grant execute on function public.is_staff(uuid) to authenticated, service_role;
grant execute on function public.is_in_cohort(uuid, uuid) to authenticated, service_role;

drop policy if exists "Published posts are public" on public.blog_posts;
create policy "Published posts are public" on public.blog_posts
  for select to anon using (is_published = true);
create policy "Signed-in read posts" on public.blog_posts
  for select to authenticated using (is_published = true or public.is_staff(auth.uid()));

revoke all on function public.increment_blog_view(text) from public, anon, authenticated;
grant execute on function public.increment_blog_view(text) to service_role;

drop policy if exists applications_public_insert on public.applications;
revoke insert on public.applications from anon;

drop policy if exists "Public can read review content" on public.reviews;
revoke select on public.reviews from anon;
alter view public.reviews_public set (security_invoker = off);
alter view public.reviews_public owner to postgres;
grant select on public.reviews_public to anon, authenticated;

create or replace view public.site_settings_public
with (security_invoker = off) as
  select brand_name, tagline, logo_url, accent from public.site_settings;
alter view public.site_settings_public owner to postgres;
revoke all on public.site_settings_public from public;
grant select on public.site_settings_public to anon, authenticated;

drop policy if exists site_settings_public_read on public.site_settings;
revoke select on public.site_settings from anon;
create policy site_settings_staff_read on public.site_settings
  for select to authenticated using (public.is_staff(auth.uid()));