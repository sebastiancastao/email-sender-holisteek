-- Ejecutar este script en el SQL Editor del proyecto Supabase:
-- https://supabase.com/dashboard/project/mnpovhuuvaexevcbrirh/sql/new
--
-- Crea la tabla que guarda la imagen y la URL de cada sección del
-- newsletter Holisteek, y el bucket de Storage donde se suben las
-- imágenes desde el panel de administración (/admin/holisteek).

-- 1) Tabla de secciones -------------------------------------------------
create table if not exists public.newsletter_sections (
  id text primary key,
  page smallint not null,
  label text not null,
  image_url text,
  link_url text,
  updated_at timestamptz not null default now()
);

comment on table public.newsletter_sections is
  'Imagen y URL editables de cada sección del newsletter Holisteek (una fila por sección, por página).';

-- Nadie accede a esta tabla directamente desde el navegador: todas las
-- lecturas/escrituras pasan por las route handlers de Next.js usando la
-- service_role key, que ignora RLS. Se activa igualmente por buena práctica.
alter table public.newsletter_sections enable row level security;

-- 2) Datos iniciales (una fila por sección) ------------------------------
insert into public.newsletter_sections (id, page, label, image_url, link_url) values
  ('p1-logo', 1, 'Página 1 — Logo (cabecera)', 'https://bwvnvzlmqqcdemkpecjw.supabase.co/storage/v1/object/public/holisteek/logo.png', null),
  ('p1-hero', 1, 'Página 1 — Portada / Hero', 'https://bwvnvzlmqqcdemkpecjw.supabase.co/storage/v1/object/public/holisteek/hero.jpg', '#'),
  ('p1-product-1', 1, 'Página 1 — Producto: Vit C', 'https://bwvnvzlmqqcdemkpecjw.supabase.co/storage/v1/object/public/holisteek/vitamins.png', '#'),
  ('p1-product-2', 1, 'Página 1 — Producto: LED Mask', 'https://bwvnvzlmqqcdemkpecjw.supabase.co/storage/v1/object/public/holisteek/ledmask.png', '#'),
  ('p1-product-3', 1, 'Página 1 — Producto: Organic Matty (izquierda)', 'https://bwvnvzlmqqcdemkpecjw.supabase.co/storage/v1/object/public/holisteek/mat.png', '#'),
  ('p1-product-4', 1, 'Página 1 — Producto: Organic Matty (derecha)', 'https://bwvnvzlmqqcdemkpecjw.supabase.co/storage/v1/object/public/holisteek/mat.png', '#'),
  ('p1-asana', 1, 'Página 1 — Asana', 'https://bwvnvzlmqqcdemkpecjw.supabase.co/storage/v1/object/public/holisteek/asana-watermark.png', '#'),
  ('p2-logo', 2, 'Página 2 — Logo (cabecera)', 'https://bwvnvzlmqqcdemkpecjw.supabase.co/storage/v1/object/public/holisteek/logo.png', null),
  ('p2-article-1', 2, 'Página 2 — Tarjeta de artículo 1', null, '#'),
  ('p2-article-2', 2, 'Página 2 — Tarjeta de artículo 2', null, '#'),
  ('p2-article-3', 2, 'Página 2 — Tarjeta de artículo 3', null, '#'),
  ('p2-explore', 2, 'Página 2 — Botón Explore More', null, '#'),
  ('p3-logo', 3, 'Página 3 — Logo (cabecera)', 'https://bwvnvzlmqqcdemkpecjw.supabase.co/storage/v1/object/public/holisteek/logo.png', null),
  ('p3-partner-icon', 3, 'Página 3 — Icono del partner destacado', null, null),
  ('p3-partner-explore', 3, 'Página 3 — Botón Explore del partner', null, '#'),
  ('p3-event-1', 3, 'Página 3 — Evento 1', null, '#'),
  ('p3-event-2', 3, 'Página 3 — Evento 2', null, '#'),
  ('p3-event-3', 3, 'Página 3 — Evento 3', null, '#')
on conflict (id) do nothing;

-- 3) Bucket de Storage para las imágenes ---------------------------------
insert into storage.buckets (id, name, public)
values ('newsletter', 'newsletter', true)
on conflict (id) do nothing;

-- Lectura pública de las imágenes subidas (además de que el bucket ya es
-- público, esta policy cubre el caso de que alguien la desactive luego).
drop policy if exists "Public read newsletter assets" on storage.objects;
create policy "Public read newsletter assets"
  on storage.objects for select
  using (bucket_id = 'newsletter');
