-- Ejecutar en el SQL Editor del proyecto Supabase, DESPUÉS de
-- newsletter_sections.sql y newsletter_sections_text.sql:
-- https://supabase.com/dashboard/project/mnpovhuuvaexevcbrirh/sql/new
--
-- Columnas adicionales para el partner destacado de la página 3
-- (best for, ubicación y categoría), usadas junto con title/description.

alter table public.newsletter_sections
  add column if not exists best_for text,
  add column if not exists location text,
  add column if not exists category text;
