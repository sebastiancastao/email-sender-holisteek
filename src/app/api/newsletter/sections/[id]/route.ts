import { NextResponse } from "next/server";
import { getSupabaseAdmin, NEWSLETTER_BUCKET, NEWSLETTER_TABLE } from "@/lib/supabaseAdmin";
import { sectionDef } from "@/lib/newsletter/sections";
import { errorMessage } from "@/lib/errorMessage";

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  const fromType = file.type.split("/").pop();
  return fromType || "bin";
}

// Actualiza la imagen, la URL y/o el texto de una sección concreta del newsletter.
// Espera multipart/form-data con:
//  - image: archivo opcional (se sube a Supabase Storage como imagen nueva)
//  - imageUrl: string opcional (asigna una imagen ya subida a la biblioteca,
//    en vez de subir un archivo nuevo — tiene prioridad "image" si vienen ambos)
//  - linkUrl: string opcional (URL de destino del botón/enlace)
//  - title / description: string opcional (solo para secciones que definen
//    esos campos de texto, p. ej. "Asana" en la página 1)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const def = sectionDef(id);

  if (!def) {
    return NextResponse.json({ error: `Sección desconocida: ${id}` }, { status: 404 });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "Supabase no está configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.",
        detail: errorMessage(err),
      },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("image");
  const imageUrlRaw = formData.get("imageUrl");
  const linkUrlRaw = formData.get("linkUrl");
  const titleRaw = formData.get("title");
  const descriptionRaw = formData.get("description");

  const update: { image_url?: string; link_url?: string; title?: string; description?: string } = {};

  if (file instanceof File && file.size > 0) {
    if (def.kind === "link") {
      return NextResponse.json(
        { error: `La sección "${def.label}" no admite imagen.` },
        { status: 400 }
      );
    }

    const path = `sections/${id}-${Date.now()}.${extensionFor(file)}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(NEWSLETTER_BUCKET)
      .upload(path, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Error subiendo la imagen: ${uploadError.message}` },
        { status: 502 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(NEWSLETTER_BUCKET)
      .getPublicUrl(path);

    update.image_url = publicUrlData.publicUrl;
  } else if (typeof imageUrlRaw === "string" && imageUrlRaw.trim() !== "") {
    if (def.kind === "link") {
      return NextResponse.json(
        { error: `La sección "${def.label}" no admite imagen.` },
        { status: 400 }
      );
    }
    update.image_url = imageUrlRaw.trim();
  }

  if (typeof linkUrlRaw === "string" && linkUrlRaw.trim() !== "") {
    if (def.kind === "image") {
      return NextResponse.json(
        { error: `La sección "${def.label}" no admite URL.` },
        { status: 400 }
      );
    }
    update.link_url = linkUrlRaw.trim();
  }

  if (typeof titleRaw === "string" && titleRaw.trim() !== "") {
    if (!def.textFields?.some((f) => f.key === "title")) {
      return NextResponse.json(
        { error: `La sección "${def.label}" no admite título.` },
        { status: 400 }
      );
    }
    update.title = titleRaw.trim();
  }

  if (typeof descriptionRaw === "string" && descriptionRaw.trim() !== "") {
    if (!def.textFields?.some((f) => f.key === "description")) {
      return NextResponse.json(
        { error: `La sección "${def.label}" no admite descripción.` },
        { status: 400 }
      );
    }
    update.description = descriptionRaw.trim();
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No se envió ningún cambio para actualizar." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from(NEWSLETTER_TABLE)
    .upsert(
      { id, page: def.page, label: def.label, ...update, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )
    .select("id, image_url, link_url, title, description")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ section: data });
}
