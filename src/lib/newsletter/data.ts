import { getSupabaseAdmin, NEWSLETTER_TABLE } from "@/lib/supabaseAdmin";
import { defaultSectionMap, SectionMap } from "./sections";

interface SectionRow {
  id: string;
  image_url: string | null;
  link_url: string | null;
  title: string | null;
  description: string | null;
}

/**
 * Carga el mapa de secciones combinando los valores guardados en Supabase
 * con los valores por defecto. Si Supabase todavía no está configurado
 * (faltan las variables de entorno) o la tabla no existe, se sirve la
 * plantilla con los valores por defecto en vez de romper el envío/preview.
 */
export async function loadSectionMap(): Promise<SectionMap> {
  const map = defaultSectionMap();

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(NEWSLETTER_TABLE)
      .select("id, image_url, link_url, title, description");

    if (error) throw error;

    for (const row of (data ?? []) as SectionRow[]) {
      if (!(row.id in map)) continue;
      if (row.image_url) map[row.id].imageUrl = row.image_url;
      if (row.link_url) map[row.id].linkUrl = row.link_url;
      if (row.title) map[row.id].title = row.title;
      if (row.description) map[row.id].description = row.description;
    }
  } catch (err) {
    console.error("No se pudieron cargar las secciones desde Supabase, usando valores por defecto:", err);
  }

  return map;
}
