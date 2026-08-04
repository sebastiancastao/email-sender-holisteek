import { getSupabaseAdmin, NEWSLETTER_TABLE } from "@/lib/supabaseAdmin";
import { defaultSectionMap, SectionMap, TEXT_FIELD_COLUMNS, TEXT_FIELD_KEYS } from "./sections";

type SectionRow = {
  id: string;
  image_url: string | null;
  link_url: string | null;
} & Record<string, string | null>;

const SELECT_COLUMNS = ["id", "image_url", "link_url", ...Object.values(TEXT_FIELD_COLUMNS)].join(", ");

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
    const { data, error } = await supabase.from(NEWSLETTER_TABLE).select(SELECT_COLUMNS);

    if (error) throw error;

    for (const row of (data ?? []) as unknown as SectionRow[]) {
      if (!(row.id in map)) continue;
      if (row.image_url) map[row.id].imageUrl = row.image_url;
      if (row.link_url) map[row.id].linkUrl = row.link_url;
      for (const key of TEXT_FIELD_KEYS) {
        const value = row[TEXT_FIELD_COLUMNS[key]];
        if (value) map[row.id][key] = value;
      }
    }
  } catch (err) {
    console.error("No se pudieron cargar las secciones desde Supabase, usando valores por defecto:", err);
  }

  return map;
}
