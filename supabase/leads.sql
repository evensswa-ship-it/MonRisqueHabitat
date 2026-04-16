create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null check (char_length(trim(first_name)) >= 2),
  email text not null check (position('@' in email) > 1),
  phone text,
  project text check (
    project is null
    or project in (
      'proteger-mon-logement',
      'preparer-un-devis',
      'etre-accompagne',
      'equiper-un-parcours-client'
    )
  ),
  consent boolean not null default false,
  selected_address jsonb not null,
  risk_summary_label text not null,
  risk_takeaway text not null
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);

alter table public.leads enable row level security;

drop policy if exists "Allow public lead insert" on public.leads;
create policy "Allow public lead insert"
on public.leads
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow public lead read for MVP" on public.leads;
create policy "Allow public lead read for MVP"
on public.leads
for select
to anon, authenticated
using (true);
