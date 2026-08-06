import { NextResponse } from "next/server";
import { getSupabaseAdmin, NEWSLETTER_TABLE } from "@/lib/supabaseAdmin";
import { sectionDef, TEXT_FIELD_COLUMNS } from "@/lib/newsletter/sections";
import { errorMessage } from "@/lib/errorMessage";
import { decodeHtmlEntities } from "@/lib/htmlEntities";

const ALLOWED_HOSTS = new Set(["holisteek.com", "www.holisteek.com"]);
const ALLOWED_PATH_PREFIX = "/guide/";
const SELECT_COLUMNS = ["id", "image_url", "link_url", ...Object.values(TEXT_FIELD_COLUMNS)].join(", ");

function metaContent(html: string, property: string): string | undefined {
  const match = html.match(
    new RegExp(`<meta[^>]*property="${property}"[^>]*content="([^"]*)"`, "i")
  );
  return match ? decodeHtmlEntities(match[1]) : undefined;
}

// POST /api/newsletter/articles/autofill
// body: { sectionId: "p2-article-1" | "p2-article-2" | "p2-article-3", url: "https://www.holisteek.com/guide/<categoria>/<slug>" }
// Extrae imagen, título y descripción de las etiquetas Open Graph de la página.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const sectionId = typeof body.sectionId === "string" ? body.sectionId : "";
  const articleUrl = typeof body.url === "string" ? body.url.trim() : "";

  const def = sectionDef(sectionId);
  if (!def || def.autofillFrom !== "article") {
    return NextResponse.json({ error: "sectionId inválido para autocompletar un artículo." }, { status: 400 });
  }

  if (!articleUrl) {
    return NextResponse.json({ error: "Falta la URL del artículo." }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(articleUrl);
  } catch {
    return NextResponse.json({ error: "La URL no es válida." }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsedUrl.hostname) || !parsedUrl.pathname.startsWith(ALLOWED_PATH_PREFIX)) {
    return NextResponse.json(
      { error: "Solo se admiten URLs de holisteek.com/guide/..." },
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

  const title = metaContent(html, "og:title");
  const description = metaContent(html, "og:description");
  const imageUrl = metaContent(html, "og:image");

  if (!title && !description && !imageUrl) {
    return NextResponse.json(
      { error: "No se encontró información del artículo en esa página." },
      { status: 422 }
    );
  }

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

  const update: Record<string, string> = { link_url: articleUrl };
  if (title) update.title = title;
  if (description) update.description = description;
  if (imageUrl) update.image_url = imageUrl;

  const { data, error } = await supabase
    .from(NEWSLETTER_TABLE)
    .upsert(
      { id: sectionId, page: def.page, label: def.label, ...update, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ section: data });
}
