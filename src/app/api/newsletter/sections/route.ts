import { NextResponse } from "next/server";
import { getSupabaseAdmin, NEWSLETTER_TABLE } from "@/lib/supabaseAdmin";
import { SECTION_DEFS, SectionDef } from "@/lib/newsletter/sections";
import { errorMessage } from "@/lib/errorMessage";

interface SectionRow {
  id: string;
  image_url: string | null;
  link_url: string | null;
  title: string | null;
  description: string | null;
  updated_at?: string;
}

export interface SectionApiItem extends SectionDef {
  imageUrl: string;
  linkUrl: string;
  title?: string;
  description?: string;
}

function textFieldDefault(def: SectionDef, key: "title" | "description"): string | undefined {
  return def.textFields?.find((f) => f.key === key)?.defaultValue;
}

// Lista todas las secciones (metadata + valor actual) para el panel de admin.
export async function GET() {
  let rows: SectionRow[] = [];

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(NEWSLETTER_TABLE)
      .select("id, image_url, link_url, title, description, updated_at");

    if (error) throw error;
    rows = (data ?? []) as SectionRow[];
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "No se pudo conectar con Supabase. Revisa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local, y que hayas ejecutado supabase/newsletter_sections.sql.",
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

    if (def.textFields?.some((f) => f.key === "title")) {
      item.title = row?.title || textFieldDefault(def, "title") || "";
    }
    if (def.textFields?.some((f) => f.key === "description")) {
      item.description = row?.description || textFieldDefault(def, "description") || "";
    }

    return item;
  });

  return NextResponse.json({ sections: items });
}
