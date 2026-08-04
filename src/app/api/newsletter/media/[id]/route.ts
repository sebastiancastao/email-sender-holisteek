import { NextResponse } from "next/server";
import { getSupabaseAdmin, NEWSLETTER_BUCKET, NEWSLETTER_MEDIA_TABLE } from "@/lib/supabaseAdmin";
import { errorMessage } from "@/lib/errorMessage";

// DELETE /api/newsletter/media/:id -> borra la imagen del bucket y de la biblioteca
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const { data: existing, error: fetchError } = await supabase
    .from(NEWSLETTER_MEDIA_TABLE)
    .select("storage_path")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 404 });
  }

  await supabase.storage.from(NEWSLETTER_BUCKET).remove([existing.storage_path]);

  const { error: deleteError } = await supabase.from(NEWSLETTER_MEDIA_TABLE).delete().eq("id", id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
