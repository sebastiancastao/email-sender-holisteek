-- Ejecutar en el SQL Editor del proyecto Supabase, DESPUÉS de
-- newsletter_sections.sql:
-- https://supabase.com/dashboard/project/mnpovhuuvaexevcbrirh/sql/new
--
-- Biblioteca de imágenes organizadas por página, para poder subir varias
-- imágenes, etiquetarlas con la página (1, 2 o 3) a la que pertenecen, y
-- luego elegir cuál va en cada sección desde /admin/holisteek.

create extension if not exists pgcrypto;

create table if not exists public.newsletter_media (
  id uuid primary key default gen_random_uuid(),
  page smallint not null,
  storage_path text not null,
  url text not null,
  label text,
  created_at timestamptz not null default now()
);

comment on table public.newsletter_media is
  'Biblioteca de imágenes subidas y etiquetadas por página (1, 2, 3) para armar el newsletter Holisteek.';

create index if not exists newsletter_media_page_idx on public.newsletter_media (page);

-- Igual que newsletter_sections: todo el acceso pasa por las route handlers
-- de Next.js con la service_role key, que ignora RLS.
alter table public.newsletter_media enable row level security;
