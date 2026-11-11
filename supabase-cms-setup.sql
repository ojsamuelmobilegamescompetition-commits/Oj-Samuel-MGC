-- OJ SAMUEL CHAMPIONSHIP CMS ADD-ON
-- Run this in Supabase SQL Editor AFTER your existing registration setup.
-- Never place a service_role key in a browser file.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.cms_items (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in
    ('announcements','tournaments','fixtures','leaderboard','winners','sponsors','gallery')),
  title text not null,
  description text not null default '',
  event_date timestamptz,
  category text not null default '',
  image_url text,
  link_url text,
  extra text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_settings (
  id integer primary key check (id = 1),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.cms_items enable row level security;
alter table public.cms_settings enable row level security;

create or replace function public.is_oj_admin()
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_oj_admin() from public;
grant execute on function public.is_oj_admin() to authenticated;

drop policy if exists "Admins can read admin allowlist" on public.admin_users;
create policy "Admins can read admin allowlist" on public.admin_users
for select to authenticated using (public.is_oj_admin());

drop policy if exists "Public can read published CMS items" on public.cms_items;
create policy "Public can read published CMS items" on public.cms_items
for select to anon, authenticated using (is_published or public.is_oj_admin());

drop policy if exists "Admins manage CMS items" on public.cms_items;
create policy "Admins manage CMS items" on public.cms_items
for all to authenticated using (public.is_oj_admin()) with check (public.is_oj_admin());

drop policy if exists "Public can read CMS settings" on public.cms_settings;
create policy "Public can read CMS settings" on public.cms_settings
for select to anon, authenticated using (true);

drop policy if exists "Admins manage CMS settings" on public.cms_settings;
create policy "Admins manage CMS settings" on public.cms_settings
for all to authenticated using (public.is_oj_admin()) with check (public.is_oj_admin());

grant select on public.cms_items, public.cms_settings to anon, authenticated;
grant insert, update, delete on public.cms_items, public.cms_settings to authenticated;

-- After creating the admin user in Supabase Authentication > Users,
-- copy that user's UUID and run this statement with the real UUID:
-- insert into public.admin_users(user_id) values ('PASTE-ADMIN-USER-UUID-HERE');
