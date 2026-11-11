-- OJ Samuel Mobile Games Competition: run in Supabase SQL Editor
create extension if not exists pgcrypto;
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create table if not exists public.registrations (
 id uuid primary key default gen_random_uuid(), registration_code text not null unique, full_name text not null, phone text not null, game text not null, gamer_tag text not null, status text not null default 'pending' check (status in ('pending','approved','rejected')), admin_note text, created_at timestamptz not null default now(), reviewed_at timestamptz
);
alter table public.admins enable row level security;
alter table public.registrations enable row level security;
create or replace function public.is_oj_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.admins where user_id=auth.uid()); $$;
grant execute on function public.is_oj_admin() to authenticated;
drop policy if exists "admins can view own allowlist row" on public.admins;
create policy "admins can view own allowlist row" on public.admins for select to authenticated using (user_id=auth.uid());
drop policy if exists "anyone can submit registration" on public.registrations;
create policy "anyone can submit registration" on public.registrations for insert to anon, authenticated with check (status='pending' and admin_note is null and reviewed_at is null);
drop policy if exists "admins can read registrations" on public.registrations;
create policy "admins can read registrations" on public.registrations for select to authenticated using (public.is_oj_admin());
drop policy if exists "admins can review registrations" on public.registrations;
create policy "admins can review registrations" on public.registrations for update to authenticated using (public.is_oj_admin()) with check (public.is_oj_admin());
create or replace function public.check_registration_status(p_code text,p_phone text) returns table(status text) language sql security definer set search_path=public as $$ select r.status from public.registrations r where r.registration_code=p_code and regexp_replace(r.phone,'[^0-9]','','g')=regexp_replace(p_phone,'[^0-9]','','g') limit 1; $$;
revoke all on function public.check_registration_status(text,text) from public;
grant execute on function public.check_registration_status(text,text) to anon,authenticated;
grant select on public.admins to authenticated;
grant select,update on public.registrations to authenticated;
grant insert on public.registrations to anon,authenticated;
-- After creating your admin user in Supabase Authentication > Users, add their UUID below:
-- insert into public.admins(user_id) values ('PASTE_ADMIN_AUTH_USER_UUID_HERE');
