-- Run this in Supabase SQL Editor
-- Creates table for application users used by /api/auth/register

create table if not exists public.uporabniki (
  id bigint generated always as identity primary key,
  ime text not null,
  priimek text not null,
  eposta text not null unique,
  geslo text not null,
  created_at timestamptz not null default now()
);

-- Recommended for data protection. Service role key still has full access.
alter table public.uporabniki enable row level security;
