import { NextResponse } from "next/server";
import { getSupabaseAdmin, NEWSLETTER_TABLE } from "@/lib/supabaseAdmin";
import { SECTION_DEFS, SectionDef, TEXT_FIELD_COLUMNS, TEXT_FIELD_KEYS, TextFieldKey } from "@/lib/newsletter/sections";
import { errorMessage } from "@/lib/errorMessage";

type SectionRow = {
  id: string;
  image_url: string | null;
  link_url: string | null;
  updated_at?: string;
} & Record<string, string | null | undefined>;

export type SectionApiItem = SectionDef & {
  imageUrl: string;
  linkUrl: string;
} & Partial<Record<TextFieldKey, string>>;

function textFieldDefault(def: SectionDef, key: TextFieldKey): string | undefined {
  return def.textFields?.find((f) => f.key === key)?.defaultValue;
}

const SELECT_COLUMNS = ["id", "image_url", "link_url", "updated_at", ...Object.values(TEXT_FIELD_COLUMNS)].join(", ");

// Lista todas las secciones (metadata + valor actual) para la página principal.
export async function GET() {
  let rows: SectionRow[] = [];

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from(NEWSLETTER_TABLE).select(SELECT_COLUMNS);

    if (error) throw error;
    rows = (data ?? []) as unknown as SectionRow[];
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "No se pudo conectar con Supabase. Revisa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local, y que hayas ejecutado los scripts en supabase/.",
        detail: errorMessage(err),
      },
      { status: 500 }
    );
  }

  const byId = new Map(rows.map((r) => [r.id, r]));

  const items: SectionApiItem[] = SECTION_DEFS.map((def) => {
    const row = byId.get(def.id);
    const item: SectionApiItem = {
      ...def,
      imageUrl: row?.image_url || def.defaultImageUrl || "",
      linkUrl: row?.link_url || def.defaultLinkUrl || "#",
    };

    for (const key of TEXT_FIELD_KEYS) {
      if (def.textFields?.some((f) => f.key === key)) {
        item[key] = row?.[TEXT_FIELD_COLUMNS[key]] || textFieldDefault(def, key) || "";
      }
    }

    return item;
  });

  return NextResponse.json({ sections: items });
}
