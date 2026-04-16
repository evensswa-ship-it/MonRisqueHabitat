create extension if not exists pgcrypto;

create table if not exists public.partner_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null check (char_length(trim(first_name)) >= 2),
  last_name text not null check (char_length(trim(last_name)) >= 2),
  company text not null check (char_length(trim(company)) >= 2),
  email text not null check (position('@' in email) > 1),
  org_type text not null,
  message text
);

create index if not exists partner_requests_created_at_idx on public.partner_requests (created_at desc);

alter table public.partner_requests enable row level security;

drop policy if exists "Allow public partner request insert" on public.partner_requests;
create policy "Allow public partner request insert"
on public.partner_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow authenticated partner request read" on public.partner_requests;
create policy "Allow authenticated partner request read"
on public.partner_requests
for select
to authenticated
using (true);
