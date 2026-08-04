-- Ejecutar en el SQL Editor del proyecto Supabase, DESPUÉS de
-- newsletter_sections.sql y newsletter_sections_text.sql:
-- https://supabase.com/dashboard/project/mnpovhuuvaexevcbrirh/sql/new
--
-- Columna para el texto de cada botón/CTA (ej. "Read Article", "Try it out",
-- "Discover More", "Explore More", "Explore").

alter table public.newsletter_sections
  add column if not exists cta text;
