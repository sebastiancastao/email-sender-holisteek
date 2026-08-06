import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getSupabaseAdmin, NEWSLETTER_BUCKET, NEWSLETTER_TABLE } from "@/lib/supabaseAdmin";
import { sectionDef, TEXT_FIELD_COLUMNS } from "@/lib/newsletter/sections";
import { errorMessage } from "@/lib/errorMessage";

const SECTION_ID = "p1-asana";
const SELECT_COLUMNS = ["id", "image_url", "link_url", ...Object.values(TEXT_FIELD_COLUMNS)].join(", ");

function buildPrompt(word: string): string {
  return `A minimalist repeating typographic pattern background for a wellness brand banner, matching this exact style: the word "${word.toUpperCase()}" repeated many times in UPPERCASE, geometric rounded sans-serif type (like Poppins Medium or Century Gothic), using a MEDIUM font weight — not thin/light, not bold/heavy, a balanced in-between weight with soft rounded letter terminals (rounded tips on letters like A, N, S). Apply wide letter-spacing (tracking) within each word so every word looks visually wide and expanded, not condensed. No italics, no serif, no script or cursive lettering. Make the lettering VERY LARGE relative to the canvas: each row of text (letters plus its spacing) must take up roughly one quarter (25%) of the total image height, so the image shows ONLY 4 rows of text total from top to bottom — not 5, not 6, only 4 big rows. If in doubt, make the letters bigger rather than smaller. Keep clear vertical spacing between the 4 rows and clear horizontal gaps between words. Words sit in straight horizontal rows (not diagonal, not rotated), some words cropped at the left and right edges as in a seamless tile. Background color: pure white (#ffffff). Text color: a neutral, low-contrast medium grey (similar to #b3b3b3, NOT beige, NOT warm-toned, NOT cream-colored) that barely stands out against the white. Completely flat design, no shadows, no gradients, no outlines, no other graphics, icons, or decorations — just the faint tiled typographic pattern. Wide banner composition.`;
}

// POST /api/newsletter/asana/generate-image
// body: { word: string }  (normalmente el valor actual del campo "Título")
// Genera con OpenAI (gpt-image-1) un fondo tipo watermark con esa palabra
// repetida, lo sube a Supabase Storage y lo guarda como imagen de la
// sección "Asana" de la página 1. Solo actualiza image_url: título,
// descripción y demás campos quedan intactos.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const word = typeof body.word === "string" ? body.word.trim() : "";

  if (!word) {
    return NextResponse.json({ error: "Falta la palabra para el fondo." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY no está configurada en .env.local." },
      { status: 500 }
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

  let base64: string;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: buildPrompt(word),
      size: "1536x1024",
      quality: "medium",
    });

    const image = result.data?.[0]?.b64_json;
    if (!image) {
      return NextResponse.json({ error: "OpenAI no devolvió una imagen." }, { status: 502 });
    }
    base64 = image;
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo generar la imagen con OpenAI.", detail: errorMessage(err) },
      { status: 502 }
    );
  }

  const path = `sections/${SECTION_ID}-${Date.now()}.png`;
  const bytes = Buffer.from(base64, "base64");

  const { error: uploadError } = await supabase.storage.from(NEWSLETTER_BUCKET).upload(path, bytes, {
    contentType: "image/png",
    upsert: true,
  });

  if (uploadError) {
    return NextResponse.json({ error: `Error subiendo la imagen: ${uploadError.message}` }, { status: 502 });
  }

  const { data: publicUrlData } = supabase.storage.from(NEWSLETTER_BUCKET).getPublicUrl(path);

  const def = sectionDef(SECTION_ID)!;

  const { data, error } = await supabase
    .from(NEWSLETTER_TABLE)
    .upsert(
      {
        id: SECTION_ID,
        page: def.page,
        label: def.label,
        image_url: publicUrlData.publicUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ section: data });
}
