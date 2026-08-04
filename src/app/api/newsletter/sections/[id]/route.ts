import { NextResponse } from "next/server";
import { getSupabaseAdmin, NEWSLETTER_BUCKET, NEWSLETTER_TABLE } from "@/lib/supabaseAdmin";
import { sectionDef, TEXT_FIELD_COLUMNS, TEXT_FIELD_KEYS } from "@/lib/newsletter/sections";
import { errorMessage } from "@/lib/errorMessage";

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  const fromType = file.type.split("/").pop();
  return fromType || "bin";
}

const SELECT_COLUMNS = ["id", "image_url", "link_url", ...Object.values(TEXT_FIELD_COLUMNS)].join(", ");

// Actualiza la imagen, la URL y/o el texto de una sección concreta del newsletter.
// Espera multipart/form-data con:
//  - image: archivo opcional (se sube a Supabase Storage)
//  - linkUrl: string opcional (URL de destino del botón/enlace)
//  - title / description / bestFor / location / category: string opcional
//    (solo para secciones que definen esos campos de texto)
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
  const linkUrlRaw = formData.get("linkUrl");

  const update: Record<string, string> = {};

  const allowsImage = def.kind === "image" || def.kind === "image+link";
  const allowsLink = def.kind === "link" || def.kind === "image+link";

  if (file instanceof File && file.size > 0) {
    if (!allowsImage) {
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
  }

  if (typeof linkUrlRaw === "string" && linkUrlRaw.trim() !== "") {
    if (!allowsLink) {
      return NextResponse.json(
        { error: `La sección "${def.label}" no admite URL.` },
        { status: 400 }
      );
    }
    update.link_url = linkUrlRaw.trim();
  }

  for (const key of TEXT_FIELD_KEYS) {
    const raw = formData.get(key);
    if (typeof raw !== "string" || raw.trim() === "") continue;

    if (!def.textFields?.some((f) => f.key === key)) {
      return NextResponse.json(
        { error: `La sección "${def.label}" no admite el campo "${key}".` },
        { status: 400 }
      );
    }
    update[TEXT_FIELD_COLUMNS[key]] = raw.trim();
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
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ section: data });
}
