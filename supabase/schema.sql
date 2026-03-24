-- Run this in Supabase SQL Editor.
-- Executable schema for this project.

create table if not exists public.uporabniki (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  ime varchar not null,
  priimek varchar not null,
  eposta varchar not null unique,
  geslo varchar not null
);

create table if not exists public.opravila (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  naslov varchar not null,
  opis text,
  od timestamp without time zone not null,
  do timestamp without time zone not null,
  uporabnik_id bigint not null references public.uporabniki(id) on delete cascade,
  kolikokrat text not null default 'samo_enkrat',
  opravljeno boolean not null default false,
  opravljeno_datumi jsonb not null default '[]'::jsonb,
  constraint opravila_kolikokrat_check check (
    kolikokrat in ('samo_enkrat', 'vsak_dan', 'vsak_teden', 'vsak_mesec', 'vsako_leto')
  ),
  constraint opravila_od_do_check check (do > od)
);

create index if not exists idx_opravila_uporabnik_id on public.opravila(uporabnik_id);

alter table public.opravila add column if not exists opravljeno boolean not null default false;
alter table public.opravila add column if not exists opravljeno_datumi jsonb not null default '[]'::jsonb;

alter table public.uporabniki enable row level security;
alter table public.opravila enable row level security;
