import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cliente de Supabase para uso EXCLUSIVO en el servidor (route handlers).
// Usa la service_role key, que nunca debe exponerse al navegador, por eso
// esta variable NO lleva el prefijo NEXT_PUBLIC_.

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno (.env.local)."
    );
  }

  cachedClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cachedClient;
}

export const NEWSLETTER_TABLE = "newsletter_sections";
export const NEWSLETTER_MEDIA_TABLE = "newsletter_media";
export const NEWSLETTER_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "newsletter";
