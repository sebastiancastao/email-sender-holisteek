-- Ejecutar en el SQL Editor del proyecto Supabase, DESPUÉS de
-- newsletter_sections.sql:
-- https://supabase.com/dashboard/project/mnpovhuuvaexevcbrirh/sql/new
--
-- Agrega columnas de texto (título / descripción) para secciones que además
-- de imagen y URL necesitan texto editable, como "Asana" en la página 1.

alter table public.newsletter_sections
  add column if not exists title text,
  add column if not exists description text;
