import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, NEWSLETTER_BUCKET, NEWSLETTER_MEDIA_TABLE } from "@/lib/supabaseAdmin";
import { isPageNumber } from "@/lib/newsletter/sections";
import { errorMessage } from "@/lib/errorMessage";

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  const fromType = file.type.split("/").pop();
  return fromType || "bin";
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// GET /api/newsletter/media           -> toda la biblioteca
// GET /api/newsletter/media?page=1|2|3 -> solo las imágenes de esa página
export async function GET(request: NextRequest) {
  const pageParam = request.nextUrl.searchParams.get("page");
  const page = pageParam ? Number(pageParam) : null;

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "No se pudo conectar con Supabase. Revisa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local, y que hayas ejecutado supabase/newsletter_media.sql.",
        detail: errorMessage(err),
      },
      { status: 500 }
    );
  }

  let query = supabase
    .from(NEWSLETTER_MEDIA_TABLE)
    .select("id, page, url, label, created_at")
    .order("created_at", { ascending: false });

  if (isPageNumber(page)) {
    query = query.eq("page", page);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ media: data ?? [] });
}

// POST /api/newsletter/media -> sube una imagen y la etiqueta con una página
// multipart/form-data: image (archivo, requerido), page (1|2|3, requerido), label (opcional)
export async function POST(request: NextRequest) {
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

  const formData = await request.formData();
  const file = formData.get("image");
  const page = Number(formData.get("page"));
  const labelRaw = formData.get("label");

  if (!isPageNumber(page)) {
    return NextResponse.json({ error: "page debe ser 1, 2 o 3" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Falta el archivo de imagen" }, { status: 400 });
  }

  const path = `media/p${page}/${Date.now()}-${sanitizeFileName(file.name || `imagen.${extensionFor(file)}`)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from(NEWSLETTER_BUCKET).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: `Error subiendo la imagen: ${uploadError.message}` }, { status: 502 });
  }

  const { data: publicUrlData } = supabase.storage.from(NEWSLETTER_BUCKET).getPublicUrl(path);

  const label = typeof labelRaw === "string" && labelRaw.trim() ? labelRaw.trim() : file.name;

  const { data, error } = await supabase
    .from(NEWSLETTER_MEDIA_TABLE)
    .insert({ page, storage_path: path, url: publicUrlData.publicUrl, label })
    .select("id, page, url, label, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ media: data });
}
