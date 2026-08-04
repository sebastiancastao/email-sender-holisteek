-- Ejecutar en el SQL Editor del proyecto Supabase, DESPUÉS de
-- newsletter_sections.sql y newsletter_sections_text.sql:
-- https://supabase.com/dashboard/project/mnpovhuuvaexevcbrirh/sql/new
--
-- Columnas para el nombre de producto y los 3 bullets de cada producto de
-- la página 1 ("What you need…"), usadas junto con "title".

alter table public.newsletter_sections
  add column if not exists subtitle text,
  add column if not exists bullet1 text,
  add column if not exists bullet2 text,
  add column if not exists bullet3 text;
