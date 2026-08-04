-- Ejecutar en el SQL Editor del proyecto Supabase, DESPUÉS de
-- newsletter_sections.sql, newsletter_sections_text.sql y
-- newsletter_sections_partner.sql:
-- https://supabase.com/dashboard/project/mnpovhuuvaexevcbrirh/sql/new
--
-- Columnas para los 3 eventos de la página 3 (día, día de la semana y
-- detalle), usadas junto con "title" para autocompletar desde
-- holisteek.com/experiences/...

alter table public.newsletter_sections
  add column if not exists day text,
  add column if not exists dow text,
  add column if not exists sub text;
