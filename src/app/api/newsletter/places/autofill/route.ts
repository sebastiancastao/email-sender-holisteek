import { NextResponse } from "next/server";
import { getSupabaseAdmin, NEWSLETTER_TABLE } from "@/lib/supabaseAdmin";
import { sectionDef, TEXT_FIELD_COLUMNS } from "@/lib/newsletter/sections";
import { errorMessage } from "@/lib/errorMessage";

const ALLOWED_HOSTS = new Set(["holisteek.com", "www.holisteek.com"]);
const SECTION_ID = "p3-partner";
const SELECT_COLUMNS = ["id", "image_url", "link_url", ...Object.values(TEXT_FIELD_COLUMNS)].join(", ");

interface PlaceLdJson {
  "@type"?: string;
  name?: string;
  url?: string;
  image?: string | string[];
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressCountry?: string;
  };
}

function extractPlaceData(html: string): PlaceLdJson | null {
  const blocks = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);

  for (const match of blocks) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && typeof parsed === "object" && (parsed.name || parsed.address)) {
        return parsed as PlaceLdJson;
      }
    } catch {
      // Bloque no es JSON válido, seguir con el siguiente.
    }
  }

  return null;
}

// POST /api/newsletter/places/autofill
// body: { url: "https://www.holisteek.com/places/<slug>" }
// Extrae imagen, nombre, ubicación y categoría de esa página (datos
// estructurados JSON-LD) y actualiza la sección "Partner destacado" de la
// página 3. La descripción y el "best for" NO se tocan: son manuales.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const placeUrl = typeof body.url === "string" ? body.url.trim() : "";

  if (!placeUrl) {
    return NextResponse.json({ error: "Falta la URL del lugar." }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(placeUrl);
  } catch {
    return NextResponse.json({ error: "La URL no es válida." }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsedUrl.hostname) || !parsedUrl.pathname.startsWith("/places/")) {
    return NextResponse.json(
      { error: "Solo se admiten URLs de holisteek.com/places/..." },
      { status: 400 }
    );
  }

  let html: string;
  try {
    const res = await fetch(parsedUrl.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HolisteekNewsletterBot/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `holisteek.com respondió con estado ${res.status} para esa URL.` },
        { status: 502 }
      );
    }
    html = await res.text();
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo abrir esa URL.", detail: errorMessage(err) },
      { status: 502 }
    );
  }

  const place = extractPlaceData(html);
  if (!place) {
    return NextResponse.json(
      { error: "No se encontró información del lugar en esa página." },
      { status: 422 }
    );
  }

  const imageUrl = Array.isArray(place.image) ? place.image[0] : place.image;
  const location = place.address?.addressLocality || place.address?.streetAddress || "";

  const def = sectionDef(SECTION_ID)!;

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json(
      {
        error: "Supabase no está configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.",
        detail: errorMessage(err),
      },
      { status: 500 }
    );
  }

  const update: Record<string, string> = { link_url: place.url || placeUrl };
  if (imageUrl) update.image_url = imageUrl;
  if (place.name) update.title = place.name;
  if (location) update.location = location;
  if (place["@type"]) update.category = place["@type"];

  const { data, error } = await supabase
    .from(NEWSLETTER_TABLE)
    .upsert(
      { id: SECTION_ID, page: def.page, label: def.label, ...update, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ section: data });
}
