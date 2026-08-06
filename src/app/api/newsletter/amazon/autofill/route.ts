import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getSupabaseAdmin, NEWSLETTER_TABLE } from "@/lib/supabaseAdmin";
import { sectionDef, TEXT_FIELD_COLUMNS } from "@/lib/newsletter/sections";
import { errorMessage } from "@/lib/errorMessage";
import { decodeHtmlEntities } from "@/lib/htmlEntities";

// Acepta amazon.com y las tiendas regionales (amazon.co.uk, amazon.de,
// amazon.com.mx, etc.), con o sin "www.".
const AMAZON_HOST_RE = /^(www\.)?amazon\.[a-z.]{2,}$/i;
const SELECT_COLUMNS = ["id", "image_url", "link_url", ...Object.values(TEXT_FIELD_COLUMNS)].join(", ");

interface AmazonProduct {
  title?: string;
  imageUrl?: string;
  bullets: string[];
}

// NOTA: Amazon no expone Open Graph ni JSON-LD para sus páginas de producto.
// Esto lee clases/IDs internos de su HTML (productTitle, feature-bullets,
// data-a-dynamic-image), que no son una API pública ni estable: Amazon puede
// cambiarlos sin aviso, y sus Términos de Uso prohíben el scraping
// automatizado. Se implementa a pedido explícito, asumiendo ese riesgo.
function extractAmazonProduct(html: string): AmazonProduct {
  const titleMatch = html.match(/id="productTitle"[^>]*>([\s\S]*?)<\/span>/);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1]).replace(/\s+/g, " ").trim() : undefined;

  let imageUrl: string | undefined;
  const dynImgMatch = html.match(/data-a-dynamic-image="([^"]+)"/);
  if (dynImgMatch) {
    try {
      const images = JSON.parse(decodeHtmlEntities(dynImgMatch[1])) as Record<string, [number, number]>;
      const [bestUrl] = Object.entries(images).sort(
        (a, b) => b[1][0] * b[1][1] - a[1][0] * a[1][1]
      )[0] ?? [];
      imageUrl = bestUrl;
    } catch {
      // JSON inválido, seguimos con el fallback de abajo.
    }
  }
  if (!imageUrl) {
    imageUrl = html.match(/id="landingImage"[^>]*src="([^"]+)"/)?.[1];
  }

  const bulletsBlock = html.match(/id="feature-bullets"[\s\S]*?<\/ul>/)?.[0] ?? "";
  const bullets = [...bulletsBlock.matchAll(/class="a-list-item">([\s\S]*?)<\/span>/g)]
    .map((m) => decodeHtmlEntities(m[1]).replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return { title, imageUrl, bullets };
}

const CONDENSE_SYSTEM_PROMPT = `You turn a raw, SEO-stuffed Amazon product title and feature bullets into short, punchy, commercial newsletter copy.
Reply with strict JSON only: {"name": string, "bullets": string[]}.
- "name": a short, commercial product name, at most 5 words. No brand SEO keyword stuffing, no model numbers unless essential.
- "bullets": exactly 3 items, each just 2 to 3 words, picking the 3 strongest selling points. No punctuation, no trailing colons.
Keep the same language as the input (English or Spanish).`;

// Convierte el título crudo y los bullets crudos de Amazon en copy corto y
// comercial. Si OpenAI no está configurado o falla, devuelve null y el
// caller sigue con el texto crudo tal cual (la extracción ya funcionó,
// no tiene sentido tirar todo el autocompletado por esto).
async function condenseWithOpenAI(
  rawTitle: string | undefined,
  rawBullets: string[]
): Promise<{ name?: string; bullets: string[] } | null> {
  if (!process.env.OPENAI_API_KEY || (!rawTitle && rawBullets.length === 0)) return null;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: CONDENSE_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify({ title: rawTitle, bullets: rawBullets.slice(0, 7) }) },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return {
      name: typeof parsed.name === "string" ? parsed.name.trim() : undefined,
      bullets: Array.isArray(parsed.bullets)
        ? parsed.bullets.filter((b: unknown): b is string => typeof b === "string" && b.trim() !== "")
        : [],
    };
  } catch {
    return null;
  }
}

// POST /api/newsletter/amazon/autofill
// body: { sectionId: "p1-product-1".."p1-product-4", url: "https://www.amazon.com/dp/<ASIN>" }
// Rellena nombre del producto (subtitle), los 3 bullets e imagen desde la
// página de Amazon. El nombre y los bullets crudos de Amazon pasan primero
// por OpenAI para acortarlos a algo comercial (nombre corto, bullets de
// 2-3 palabras); si OpenAI no está configurado o falla, se guarda el texto
// crudo tal cual. El "título" (frase gancho) y el texto del botón quedan
// intactos: son copy manual, no datos del producto.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const sectionId = typeof body.sectionId === "string" ? body.sectionId : "";
  const productUrl = typeof body.url === "string" ? body.url.trim() : "";

  const def = sectionDef(sectionId);
  if (!def || def.autofillFrom !== "amazon") {
    return NextResponse.json({ error: "sectionId inválido para autocompletar un producto." }, { status: 400 });
  }

  if (!productUrl) {
    return NextResponse.json({ error: "Falta la URL del producto." }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(productUrl);
  } catch {
    return NextResponse.json({ error: "La URL no es válida." }, { status: 400 });
  }

  if (!AMAZON_HOST_RE.test(parsedUrl.hostname)) {
    return NextResponse.json({ error: "Solo se admiten URLs de amazon.com (o tiendas regionales)." }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Amazon respondió con estado ${res.status} para esa URL.` },
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

  if (/type the characters you see|api-services-support@amazon/i.test(html)) {
    return NextResponse.json(
      { error: "Amazon bloqueó la petición (pidió un captcha). Intenta de nuevo en unos minutos." },
      { status: 502 }
    );
  }

  const product = extractAmazonProduct(html);
  if (!product.title && !product.imageUrl && product.bullets.length === 0) {
    return NextResponse.json(
      { error: "No se encontró información del producto en esa página." },
      { status: 422 }
    );
  }

  const condensed = await condenseWithOpenAI(product.title, product.bullets);
  const name = condensed?.name || product.title;
  const bullets = condensed?.bullets.length ? condensed.bullets : product.bullets;

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

  const update: Record<string, string> = { link_url: productUrl };
  if (name) update.subtitle = name;
  if (product.imageUrl) update.image_url = product.imageUrl;
  bullets.slice(0, 3).forEach((bullet, i) => {
    update[`bullet${i + 1}`] = bullet;
  });

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
